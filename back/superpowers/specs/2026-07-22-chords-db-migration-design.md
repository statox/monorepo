# Chords feature: move storage from S3 JSON to MySQL

Date: 2026-07-22

## Context

Chords are currently stored as a single JSON blob (`songbook/index.json`) on S3, with no stable identity per entry (order in the array is the only "id"). Visit tracking for chord links already lives separately, in a `ChordFrequency` MySQL table keyed by `url` (`count`, `lastAccessDateUnix`). This rework moves chord storage into MySQL, merges visit tracking into the same table, and replaces the "replace the whole list" write model with single-entry inserts.

## Schema

New table `src/tools/tables/Chord.sql`:

```sql
CREATE TABLE IF NOT EXISTS `Chord` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `artist` varchar(400) NOT NULL,
    `title` varchar(400) NOT NULL,
    `url` varchar(400) NOT NULL,
    `tags` varchar(400) NOT NULL,
    `creationDateUnix` int(11) unsigned NOT NULL,
    `visitsCount` int(11) NOT NULL DEFAULT 0,
    `lastAccessDateUnix` int(11) unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `url_uniq` (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
```

- `tags` is stored as a `JSON.stringify`'d string, parsed back on read - same convention as `Reactor.tags`.
- `creationDateUnix` is seconds (`UNIX_TIMESTAMP()`), computed server-side on insert - **not** the old millisecond `creationDate` from the JSON file. This is a deliberate unit/name change from the old `Chord.creationDate`.
- `url_uniq` backs both duplicate-entry rejection on insert and the url-based lookup used by visit tracking.
- `visitsCount`/`lastAccessDateUnix` replace the standalone `ChordFrequency` table for this data.

`ChordFrequency.sql` is left in place unchanged, with a comment added:
```sql
-- TODO: superseded by Chord.visitsCount/lastAccessDateUnix, drop this table once confirmed unused.
```
No application code will reference `ChordFrequency` after this change; the table itself is not dropped as part of this work.

## Module layer (`src/libs/modules/chords/`)

**`types.ts`**
```ts
export type Chord = {
    id: number;
    artist: string;
    title: string;
    url: string;
    tags: string[];
    creationDateUnix: number;
    visitsCount: number;
    lastAccessDateUnix: number | null;
};
```

**`queries.ts`**
- `getAllChords()`: `SELECT * FROM Chord`, parses `tags` via `JSON.parse`. Removes the S3 `GetObjectCommand` logic entirely.
- `getLinksVisitsCount` is **removed** (function, not just the route).
- `addLinkVisit({ url })`: `UPDATE Chord SET visitsCount = visitsCount + 1, lastAccessDateUnix = UNIX_TIMESTAMP() WHERE url = ?`. If the query reports `affectedRows === 0`, throw `ChordNotFoundError`.

**`commands.ts`**
- `updateChords` is replaced by `addChord({ artist, title, url, tags }: { artist: string; title: string; url: string; tags: string[] })`:
  - `INSERT INTO Chord (artist, title, url, tags, creationDateUnix, visitsCount) VALUES (?, ?, ?, ?, UNIX_TIMESTAMP(), 0)`.
  - On `ER_DUP_ENTRY` (duplicate `url`), use the existing `handleDuplicateEntry` helper to throw with the existing `ITEM_ALREADY_EXISTS` code (same pattern as `reactor/addEntry.ts`). No new error code needed.

**New `errors.ts`**
```ts
import { AppError } from '../../errors/AppError.js';

export class ChordNotFoundError extends AppError {
    constructor() {
        super({ code: 'ITEM_NOT_FOUND', httpStatus: 400 });
    }
}
```
Reuses the existing generic `ITEM_NOT_FOUND` code - no `ERROR_CODES` addition required.

**`urlsChecker.ts`**: unchanged logic; it just consumes the richer `Chord` type returned by `getAllChords`.

**`index.ts`**: update exports - drop `getLinksVisitsCount`, `updateChords`; add `addChord`, `ChordNotFoundError`.

## Routes (`src/libs/routes/chords/`)

- **`getAll.ts`**: output schema updated to the full row shape - `id`, `artist`, `title`, `url`, `tags`, `creationDateUnix`, `visitsCount`, `lastAccessDateUnix` (nullable), all required, `additionalProperties: false`. This is a breaking contract change for the frontend (`creationDate` ms → `creationDateUnix` s, plus new fields); updating the frontend is out of scope for this backend change but should be flagged when this ships.
- **`updateAll.ts`**: **deleted**, along with its registration in `src/libs/routes/index.ts`.
- **New `addEntry.ts`**: `POST /chords/addEntry`.
  - `authentication: 'user2'`, `scope: 'admin'`.
  - Input: `{ artist: string (minLength 1), title: string (minLength 1), url: string (minLength 1), tags: string[] }`, `additionalProperties: false`.
  - Handler calls `addChord(...)`.
  - `clientErrors: ['ITEM_ALREADY_EXISTS']`.
  - Output: `emptyObjectSchema` (matches the existing `updateAll`/`addLinkVisit` convention of returning nothing on success).
- **`addLinkVisit.ts`**: input/output contract unchanged; add `clientErrors: ['ITEM_NOT_FOUND']`.
- **`getLinksVisitsCount.ts`**: **deleted** (route file + registration).
- **`checkLinks.ts`**: the embedded `chord` object schema in the output is updated to match the new `Chord` shape in full (`id`, `creationDateUnix`, `visitsCount`, `lastAccessDateUnix` added to `properties`/`required`), keeping `additionalProperties: false` so the SDK stays strictly typed - not relaxed.

`src/libs/routes/index.ts` updates: remove `updateAll` and `getLinksVisitsCount` imports/registrations, add `addEntry`.

## Tests

- `tests/routes/chords/updateAll/updateAll.test.ts` **deleted**.
- New `tests/routes/chords/addEntry/addEntry.test.ts`: valid insert (asserts row in `Chord` via `th.mysql.checkContains`), duplicate-url rejection (expect 400 / `ITEM_ALREADY_EXISTS`).
- `tests/routes/chords/addLinkVisit/addLinkVisit.test.ts`: fixtures switch from `ChordFrequency` to `Chord` rows (seeded with `visitsCount`/`lastAccessDateUnix`); add a case for "url not in Chord → error, no rows changed".
- `tests/routes/chords/getLinksVisitsCount/getLinksVisitsCount.test.ts` **deleted**.
- Any existing/new `getAll` and `checkLinks` tests seed via `th.mysql.fixture({ Chord: [...] })` instead of mocking S3 `GetObject`.

Per the "tests should have only their fixture updated" instruction, no test framework/helper changes are needed - only which table is fixtured and which endpoints exist.

## Migration script

New standalone script `src/tools/chords/migrate-chords-from-s3.ts`, run manually the same way as `src/tools/auth/createUser.ts` / the ELK populate scripts (not wired into `package.json`):

1. Fetch `songbook/index.json` from S3 (same bucket/key `getAllChords` used to read).
2. Read all rows from `ChordFrequency`.
3. For each chord in the JSON array, look up a `ChordFrequency` row by matching `url`; if found, carry over `count`→`visitsCount` and `lastAccessDateUnix`, else `visitsCount = 0`, `lastAccessDateUnix = null`.
4. Insert into `Chord`, with `creationDateUnix = Math.floor(chord.creationDate / 1000)`.
5. Log a summary (count inserted, count skipped/failed) to the console.

## Out of scope

- Frontend changes (consuming the new `getAll`/`addEntry` contracts, removing calls to the deleted `updateAll`/`getLinksVisitsCount` endpoints).
- Editing or deleting existing chord entries (add-only for now).
- Dropping the `ChordFrequency` table (left as a TODO comment only).
- Regenerating the SDK (`npm run generate:sdk`) - to be run once routes are finalized, as a normal post-change step, not part of the design.
