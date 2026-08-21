# Chords: S3 to MySQL Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the `chords` feature's storage from an S3 JSON blob to a new `Chord` MySQL table, merging in the existing `ChordFrequency` visit-tracking table, and replace the "replace whole list" write model with a single-entry `addEntry` endpoint.

**Architecture:** New `Chord` table (id, artist, title, url, tags, creationDateUnix, visitsCount, lastAccessDateUnix) replaces both `songbook/index.json` on S3 and the `ChordFrequency` table for reads/writes. Routes stay thin; all query/command logic lives in `src/libs/modules/chords/`. `updateAll` and `getLinksVisitsCount` routes are deleted; a new `addEntry` route is added. A standalone migration script backfills the table from the current S3 file + `ChordFrequency`.

**Tech Stack:** TypeScript, Express 5, mysql2/promise, ajv (JSON schema via `json-schema-to-ts`), Mocha/Chai/Supertest/Sinon.

## Global Constraints

- ES modules: all relative imports use `.js` extensions even though source is `.ts`.
- `slog.log()` component/data fields must come from `AppLogComponent`/`LoggableProperties` in `src/libs/modules/logging/types.ts` - do not invent new strings.
- New `AppError` codes must be added to `ERROR_CODES` in `src/libs/errors/codes.ts` and to `clientErrors` on every route that intentionally throws them. This plan reuses only existing codes (`ITEM_ALREADY_EXISTS`, `ITEM_NOT_FOUND`), so no `codes.ts` change is needed.
- Tests run against compiled JS in `dist/`; `npm run watch` must be running (or run `npm run build` once) before `npm run tests`.
- After all route changes, run `npm run generate:sdk` once at the end (not per-task).
- `npm run check` (lint + prettier) must pass before any task is considered done.

---

### Task 1: Add the `Chord` table and annotate `ChordFrequency` as deprecated

**Files:**
- Create: `src/tools/tables/Chord.sql`
- Modify: `src/tools/tables/ChordFrequency.sql`

**Interfaces:**
- Produces: `Chord` table with columns `id, artist, title, url, tags, creationDateUnix, visitsCount, lastAccessDateUnix`, unique on `url`. Later tasks query/insert against this exact table/column set.

- [ ] **Step 1: Create the table definition**

Create `src/tools/tables/Chord.sql`:

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

- [ ] **Step 2: Add a deprecation comment to `ChordFrequency.sql`**

Prepend this line to `src/tools/tables/ChordFrequency.sql` (keep the existing `CREATE TABLE` statement unchanged below it):

```sql
-- TODO: superseded by Chord.visitsCount/lastAccessDateUnix, drop this table once confirmed unused.
CREATE TABLE IF NOT EXISTS `ChordFrequency` (
```

(i.e. the file's first line becomes the comment, then the existing `CREATE TABLE IF NOT EXISTS` line follows as before - do not duplicate it.)

- [ ] **Step 3: Apply the table locally**

Run: `./src/tools/init-db.sh`
Expected output includes `DONE init-db` with no SQL errors.

- [ ] **Step 4: Apply the table to the test database**

Run: `./src/tools/init-db.sh --tests`
Expected output includes `DONE init-db` with no SQL errors.

- [ ] **Step 5: Commit**

```bash
git add src/tools/tables/Chord.sql src/tools/tables/ChordFrequency.sql
git commit -m "chords: add Chord table, mark ChordFrequency deprecated"
```

---

### Task 2: Rework the module layer (`types.ts`, `queries.ts`, `commands.ts`, `errors.ts`, `index.ts`)

**Files:**
- Modify: `src/libs/modules/chords/types.ts`
- Modify: `src/libs/modules/chords/queries.ts`
- Modify: `src/libs/modules/chords/commands.ts`
- Create: `src/libs/modules/chords/errors.ts`
- Modify: `src/libs/modules/chords/index.ts`

**Interfaces:**
- Consumes: `db` from `../../databases/db.js` (`db.query`, `db.execute`), `handleDuplicateEntry` from `../../errors/dbHelpers.js`, `AppError` from `../../errors/AppError.js`.
- Produces:
  - `Chord` type: `{ id: number; artist: string; title: string; url: string; tags: string[]; creationDateUnix: number; visitsCount: number; lastAccessDateUnix: number | null }`
  - `getAllChords(): Promise<Chord[]>`
  - `addChord(params: { artist: string; title: string; url: string; tags: string[] }): Promise<void>` - throws `AppError` with code `ITEM_ALREADY_EXISTS` on duplicate `url`.
  - `addLinkVisit(params: { url: string }): Promise<void>` - throws `ChordNotFoundError` (code `ITEM_NOT_FOUND`) if no row matches.
  - `ChordNotFoundError` class.
  - Exports from `index.ts`: `checkChordsUrl`, `addChord`, `addLinkVisit`, `getAllChords`, `ChordNotFoundError`. `getLinksVisitsCount` and `updateChords` are no longer exported.

- [ ] **Step 1: Update `types.ts`**

Replace the full content of `src/libs/modules/chords/types.ts`:

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

- [ ] **Step 2: Create `errors.ts`**

Create `src/libs/modules/chords/errors.ts`:

```ts
import { AppError } from '../../errors/AppError.js';

export class ChordNotFoundError extends AppError {
    constructor() {
        super({ code: 'ITEM_NOT_FOUND', httpStatus: 400 });
    }
}
```

- [ ] **Step 3: Rewrite `queries.ts`**

Replace the full content of `src/libs/modules/chords/queries.ts`:

```ts
import { OkPacket, RowDataPacket } from 'mysql2';
import { Chord } from './types.js';
import { db } from '../../databases/db.js';
import { ChordNotFoundError } from './errors.js';

type ChordRow = {
    id: number;
    artist: string;
    title: string;
    url: string;
    tags: string;
    creationDateUnix: number;
    visitsCount: number;
    lastAccessDateUnix: number | null;
};

export const getAllChords = async (): Promise<Chord[]> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, artist, title, url, tags, creationDateUnix, visitsCount, lastAccessDateUnix FROM Chord'
    );

    return (rows as ChordRow[]).map((row) => ({
        ...row,
        tags: JSON.parse(row.tags)
    }));
};

export const addLinkVisit = async (params: { url: string }) => {
    const [result] = await db.execute(
        `UPDATE Chord SET visitsCount = visitsCount + 1, lastAccessDateUnix = UNIX_TIMESTAMP() WHERE url = ?`,
        [params.url]
    );

    if ((result as OkPacket).affectedRows === 0) {
        throw new ChordNotFoundError();
    }
};
```

- [ ] **Step 4: Rewrite `commands.ts`**

Replace the full content of `src/libs/modules/chords/commands.ts`:

```ts
import { db } from '../../databases/db.js';
import { handleDuplicateEntry } from '../../errors/dbHelpers.js';

export const addChord = async (params: {
    artist: string;
    title: string;
    url: string;
    tags: string[];
}) => {
    try {
        await db.query(
            `INSERT INTO Chord (artist, title, url, tags, creationDateUnix, visitsCount)
             VALUES (?, ?, ?, ?, UNIX_TIMESTAMP(), 0)`,
            [params.artist, params.title, params.url, JSON.stringify(params.tags)]
        );
    } catch (error) {
        handleDuplicateEntry(error, 'ITEM_ALREADY_EXISTS');
    }
};
```

- [ ] **Step 5: Update `index.ts`**

Replace the full content of `src/libs/modules/chords/index.ts`:

```ts
import { checkChordsUrl } from './urlsChecker.js';
import { addChord } from './commands.js';
import { addLinkVisit, getAllChords } from './queries.js';
import { ChordNotFoundError } from './errors.js';

export { addChord, addLinkVisit, checkChordsUrl, getAllChords, ChordNotFoundError };
```

- [ ] **Step 6: Type-check the module**

Run: `npx tsc --noEmit`
Expected: no errors referencing `chords/` files. (Errors in `src/libs/routes/chords/*` and `src/tools/chords/*` are expected at this point - those are fixed in later tasks.)

- [ ] **Step 7: Commit**

```bash
git add src/libs/modules/chords
git commit -m "chords: rework module layer to read/write Chord table instead of S3"
```

---

### Task 3: Update `getAll` and `checkLinks` routes for the new `Chord` shape

**Files:**
- Modify: `src/libs/routes/chords/getAll.ts`
- Modify: `src/libs/routes/chords/checkLinks.ts`

**Interfaces:**
- Consumes: `getAllChords` and `checkChordsUrl` from `../../modules/chords/index.js` (unchanged signatures from Task 2).
- Produces: `getAll` route now outputs the full `Chord` row shape; `checkLinks` route's embedded chord schema matches the same shape.

- [ ] **Step 1: Update `getAll.ts` output schema**

Replace the full content of `src/libs/routes/chords/getAll.ts`:

```ts
import { FromSchema } from 'json-schema-to-ts';
import { getAllChords } from '../../modules/chords/index.js';
import { EmptyInput, GetRoute } from '../types.js';

const handler = async () => {
    return await getAllChords();
};

const outputSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            id: { type: 'number' },
            artist: { type: 'string' },
            title: { type: 'string' },
            url: { type: 'string' },
            creationDateUnix: { type: 'number' },
            tags: {
                type: 'array',
                items: { type: 'string' }
            },
            visitsCount: { type: 'number' },
            lastAccessDateUnix: { type: ['number', 'null'] }
        },
        required: [
            'id',
            'artist',
            'title',
            'url',
            'creationDateUnix',
            'tags',
            'visitsCount',
            'lastAccessDateUnix'
        ],
        additionalProperties: false
    }
} as const;

export const route: GetRoute<EmptyInput, FromSchema<typeof outputSchema>> = {
    method: 'get',
    path: '/chords/getAll',
    handler,
    authentication: 'none',
    outputSchema
};
```

- [ ] **Step 2: Update `checkLinks.ts` embedded chord schema**

In `src/libs/routes/chords/checkLinks.ts`, replace the `chord` property definition inside the `fails` items schema (currently lines 34-57) with:

```ts
                    chord: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            artist: { type: 'string' },
                            title: { type: 'string' },
                            url: { type: 'string' },
                            creationDateUnix: { type: 'number' },
                            tags: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            visitsCount: { type: 'number' },
                            lastAccessDateUnix: { type: ['number', 'null'] }
                        },
                        required: [
                            'id',
                            'artist',
                            'title',
                            'url',
                            'creationDateUnix',
                            'tags',
                            'visitsCount',
                            'lastAccessDateUnix'
                        ],
                        additionalProperties: false
                    },
```

Leave the rest of the file (the `status`/`error` properties, the route definition) unchanged.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `src/libs/routes/chords/getAll.ts` or `checkLinks.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/libs/routes/chords/getAll.ts src/libs/routes/chords/checkLinks.ts
git commit -m "chords: update getAll/checkLinks output schemas for new Chord shape"
```

---

### Task 4: Replace `updateAll` with `addEntry`

**Files:**
- Delete: `src/libs/routes/chords/updateAll.ts`
- Delete: `tests/routes/chords/updateAll/updateAll.test.ts`
- Create: `src/libs/routes/chords/addEntry.ts`
- Create: `tests/routes/chords/addEntry/addEntry.test.ts`
- Modify: `src/libs/routes/index.ts`

**Interfaces:**
- Consumes: `addChord` from `../../modules/chords/index.js` (Task 2).
- Produces: `POST /chords/addEntry`, input `{ artist, title, url, tags }`, output empty object, `clientErrors: ['ITEM_ALREADY_EXISTS']`.

- [ ] **Step 1: Delete the old route and test**

```bash
rm src/libs/routes/chords/updateAll.ts
rm -r tests/routes/chords/updateAll
```

- [ ] **Step 2: Create the new route**

Create `src/libs/routes/chords/addEntry.ts`:

```ts
import { FromSchema } from 'json-schema-to-ts';
import { EmptyOutput, PostRoute, RouteHandler } from '../types.js';
import { addChord } from '../../modules/chords/index.js';
import { emptyObjectSchema } from '../helpers.js';

const handler: RouteHandler<Input> = async (params) => {
    const { artist, title, url, tags } = params.input;
    params.loggableContext.addData('chords_newChordUrl', url);
    await addChord({ artist, title, url, tags });
};

const inputSchema = {
    type: 'object',
    required: ['artist', 'title', 'url', 'tags'],
    additionalProperties: false,
    properties: {
        artist: {
            type: 'string',
            minLength: 1
        },
        title: {
            type: 'string',
            minLength: 1
        },
        url: {
            type: 'string',
            minLength: 1
        },
        tags: {
            type: 'array',
            items: {
                type: 'string'
            }
        }
    }
} as const;

type Input = FromSchema<typeof inputSchema>;

export const route: PostRoute<Input, EmptyOutput> = {
    method: 'post',
    path: '/chords/addEntry',
    inputSchema,
    handler,
    authentication: 'user2',
    scope: 'admin',
    clientErrors: ['ITEM_ALREADY_EXISTS'],
    outputSchema: emptyObjectSchema
};
```

Note: `params.loggableContext.addData('chords_newChordUrl', url)` requires `chords_newChordUrl` to exist in `LoggableProperties` (`src/libs/modules/logging/types.ts`). This is handled in Step 3 below - do not skip it, the build will fail otherwise.

- [ ] **Step 3: Add the new loggable property**

Read `src/libs/modules/logging/types.ts`, find the `LoggableProperties` type definition, and add a `chords_newChordUrl: string;` field to it (place it near other feature-specific properties, following the file's existing naming/grouping convention).

- [ ] **Step 4: Register the route, remove the old one**

In `src/libs/routes/index.ts`:
- Remove the import `import { route as Chords_updateAll } from './chords/updateAll.js';` and add `import { route as Chords_addEntry } from './chords/addEntry.js';` in its correct alphabetical position among the `Chords_*` imports (`addEntry` sorts before `addLinkVisit`, i.e. first among the `Chords_*` imports - not in `updateAll`'s old slot).
- In the `routes.list` array, remove `Chords_updateAll` and add `Chords_addEntry` in the same corrected alphabetical position (first among the `Chords_*` entries, before `Chords_addLinkVisit`).

- [ ] **Step 5: Write the route tests**

Create `tests/routes/chords/addEntry/addEntry.test.ts`:

```ts
import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';

describe('chords/addEntry', () => {
    it('should create a new chord entry', async () => {
        await request(app)
            .post('/chords/addEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                artist: 'a cool artist',
                title: 'a cool title',
                url: 'https://site.com/url',
                tags: ['slow', 'chill']
            })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {});
            });

        await th.mysql.checkContains({
            Chord: [
                {
                    artist: 'a cool artist',
                    title: 'a cool title',
                    url: 'https://site.com/url',
                    creationDateUnix: th.mysql.aroundNowSec,
                    visitsCount: 0,
                    lastAccessDateUnix: null,
                    tags: (value: string) => {
                        assert.deepEqual(JSON.parse(value), ['slow', 'chill']);
                        return true;
                    }
                }
            ]
        });

        th.slog.checkLog('app', 'access-log', {
            path: '/chords/addEntry',
            context: {
                chords_newChordUrl: 'https://site.com/url'
            }
        });
    });

    it('should reject a duplicate url', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'existing artist',
                    title: 'existing title',
                    url: 'https://site.com/url',
                    tags: '[]',
                    creationDateUnix: 10,
                    visitsCount: 0,
                    lastAccessDateUnix: null
                }
            ]
        });

        await request(app)
            .post('/chords/addEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                artist: 'another artist',
                title: 'another title',
                url: 'https://site.com/url',
                tags: []
            })
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_ALREADY_EXISTS' });
            });

        await th.mysql.checkTableLength('Chord', 1);
    });

    it('rejects an empty artist', async () => {
        await request(app)
            .post('/chords/addEntry')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                artist: '',
                title: 'a cool title',
                url: 'https://site.com/url',
                tags: []
            })
            .expect(400);

        await th.mysql.checkTableLength('Chord', 0);
    });
});
```

- [ ] **Step 6: Build and run the chords route tests**

Run: `npm run build && src/tools/init-db.sh --tests && TZ=UTC PORT=3001 ENV=tests npx mocha --config tests/mocha/routes.json --grep 'chords/addEntry'`
Expected: 3 passing tests.

- [ ] **Step 7: Commit**

```bash
git add src/libs/routes/chords/addEntry.ts tests/routes/chords/addEntry src/libs/routes/index.ts src/libs/modules/logging/types.ts
git commit -m "chords: replace updateAll with single-entry addEntry route"
```

---

### Task 5: Update `addLinkVisit` route and tests to use the `Chord` table

**Files:**
- Modify: `src/libs/routes/chords/addLinkVisit.ts`
- Modify: `tests/routes/chords/addLinkVisit/addLinkVisit.test.ts`

**Interfaces:**
- Consumes: `addLinkVisit` from `../../modules/chords/index.js` (Task 2), which now throws `ChordNotFoundError` (code `ITEM_NOT_FOUND`) instead of always succeeding.

- [ ] **Step 1: Add `clientErrors` to the route**

In `src/libs/routes/chords/addLinkVisit.ts`, add `clientErrors: ['ITEM_NOT_FOUND'],` to the route object (between `scope: 'admin',` and `outputSchema: emptyObjectSchema`). The rest of the file is unchanged.

- [ ] **Step 2: Rewrite the test to use `Chord` fixtures**

Replace the full content of `tests/routes/chords/addLinkVisit/addLinkVisit.test.ts`:

```ts
import request from 'supertest';
import { app } from '../../../../src/app.js';
import { assert } from 'chai';
import { th } from '../../../helpers/index.js';

describe('chords/addLinkVisit', () => {
    it('should increment visitsCount on an existing chord', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'artist',
                    title: 'title',
                    url: 'https://bar.com',
                    tags: '[]',
                    creationDateUnix: 1,
                    visitsCount: 2,
                    lastAccessDateUnix: 1
                },
                {
                    id: 2,
                    artist: 'other artist',
                    title: 'other title',
                    url: 'https://foo.com',
                    tags: '[]',
                    creationDateUnix: 1,
                    visitsCount: 1,
                    lastAccessDateUnix: 1
                }
            ]
        });

        await request(app)
            .post('/chords/addLinkVisit')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                url: 'https://bar.com'
            })
            .expect(200)
            .then((response) => {
                assert.deepEqual(response.body, {});
            });

        await th.mysql.checkContains({
            Chord: [
                {
                    url: 'https://bar.com',
                    visitsCount: 3,
                    lastAccessDateUnix: th.mysql.aroundNowSec
                },
                {
                    url: 'https://foo.com',
                    visitsCount: 1,
                    lastAccessDateUnix: 1
                }
            ]
        });

        th.slog.checkLog('app', 'access-log', {
            path: '/chords/addLinkVisit',
            context: {
                visitedUrl: 'https://bar.com'
            }
        });
    });

    it('should reject a url with no matching chord', async () => {
        await th.mysql.fixture({
            Chord: [
                {
                    id: 1,
                    artist: 'artist',
                    title: 'title',
                    url: 'https://foo.com',
                    tags: '[]',
                    creationDateUnix: 1,
                    visitsCount: 1,
                    lastAccessDateUnix: 1
                }
            ]
        });

        await request(app)
            .post('/chords/addLinkVisit')
            .set('Cookie', th.auth2.getPassportSessionCookie())
            .set('Accept', 'application/json')
            .send({
                url: 'https://unknown.com'
            })
            .expect(400)
            .then((response) => {
                assert.deepEqual(response.body, { httpStatus: 400, code: 'ITEM_NOT_FOUND' });
            });

        await th.mysql.checkContains({
            Chord: [
                {
                    url: 'https://foo.com',
                    visitsCount: 1,
                    lastAccessDateUnix: 1
                }
            ]
        });
    });
});
```

- [ ] **Step 3: Build and run**

Run: `npm run build && TZ=UTC PORT=3001 ENV=tests npx mocha --config tests/mocha/routes.json --grep 'chords/addLinkVisit'`
Expected: 2 passing tests.

- [ ] **Step 4: Commit**

```bash
git add src/libs/routes/chords/addLinkVisit.ts tests/routes/chords/addLinkVisit
git commit -m "chords: rewire addLinkVisit to Chord table, add not-found error"
```

---

### Task 6: Remove `getLinksVisitsCount`

**Files:**
- Delete: `src/libs/routes/chords/getLinksVisitsCount.ts`
- Delete: `tests/routes/chords/getLinksVisitsCount/getLinksVisitsCount.test.ts`
- Modify: `src/libs/routes/index.ts`

- [ ] **Step 1: Delete the route and test**

```bash
rm src/libs/routes/chords/getLinksVisitsCount.ts
rm -r tests/routes/chords/getLinksVisitsCount
```

- [ ] **Step 2: Remove its registration**

In `src/libs/routes/index.ts`, remove the line `import { route as Chords_getLinksVisitsCount } from './chords/getLinksVisitsCount.js';` and remove `Chords_getLinksVisitsCount,` from the `routes.list` array.

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/libs/routes/chords/getLinksVisitsCount.ts tests/routes/chords/getLinksVisitsCount src/libs/routes/index.ts 2>/dev/null; git add -u
git commit -m "chords: remove getLinksVisitsCount endpoint"
```

---

### Task 7: Full test/lint pass and SDK regeneration

**Files:**
- None created/modified directly - verification and generated-artifact task.

- [ ] **Step 1: Lint and format check**

Run: `npm run check`
Expected: no errors. If it fails, run `npm run lint:fix` and `npm run prettier:fix`, then re-run `npm run check`.

- [ ] **Step 2: Full route test suite**

Run: `npm run build && npm run tests`
Expected: all tests pass, including every `chords/*` suite (`addEntry`, `addLinkVisit`) and no failures elsewhere (confirms nothing else referenced the removed `updateAll`/`getLinksVisitsCount` exports or the old `Chord` shape).

- [ ] **Step 3: Framework and package test suites**

Run: `npm run tests:framework && npm run tests:packages`
Expected: all pass (sanity check - this feature shouldn't touch these, but confirms no accidental breakage).

- [ ] **Step 4: Regenerate the SDK**

Run: `npm run generate:sdk`
Expected: completes without error; diff in the generated SDK output directory shows `updateAll`/`getLinksVisitsCount` removed and `addEntry` added, and `getAll`/`checkLinks` types reflecting the new `Chord` shape.

- [ ] **Step 5: Commit the generated SDK changes**

```bash
git add -A
git commit -m "chords: regenerate SDK after route changes"
```

---

### Task 8: Migration script to backfill `Chord` from S3 + `ChordFrequency`

**Files:**
- Create: `src/tools/chords/migrate-chords-from-s3.ts`

**Interfaces:**
- Consumes: `S3` client from `../../libs/databases/s3.js`, `db` from `../../libs/databases/db.js`, `Chord` shape from the old S3 JSON format (`{ artist, title, url, creationDate, tags }`, `creationDate` in **milliseconds**).
- Produces: a standalone script (run manually via `node dist/src/tools/chords/migrate-chords-from-s3.js`, following the same pattern as `src/tools/auth/createUser.ts`), not wired into `package.json`.

- [ ] **Step 1: Write the script**

Create `src/tools/chords/migrate-chords-from-s3.ts`:

```ts
/**
 * One-off migration: reads the legacy chords list from S3 (songbook/index.json)
 * and the existing ChordFrequency visit-tracking table, merges them, and
 * populates the new Chord table.
 *
 * Usage:
 *      node dist/src/tools/chords/migrate-chords-from-s3.js
 *
 * Must be run after `npm run build` and after the Chord table has been
 * created (src/tools/init-db.sh).
 */
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { RowDataPacket } from 'mysql2';
import { S3 } from '../../libs/databases/s3.js';
import { db } from '../../libs/databases/db.js';

type LegacyChord = {
    artist: string;
    title: string;
    url: string;
    creationDate: number;
    tags: string[];
};

type ChordFrequencyRow = {
    url: string;
    count: number;
    lastAccessDateUnix: number;
};

const getLegacyChords = async (): Promise<LegacyChord[]> => {
    const cmd = new GetObjectCommand({ Bucket: 'songbook', Key: 'index.json' });
    const res = await S3.send(cmd);
    const str = await res.Body?.transformToString();
    if (!str) {
        throw new Error('Empty chords file');
    }
    return JSON.parse(str);
};

const getChordFrequencyByUrl = async (): Promise<Map<string, ChordFrequencyRow>> => {
    const [rows] = await db.query<RowDataPacket[]>(
        'SELECT url, count, lastAccessDateUnix FROM ChordFrequency'
    );
    const byUrl = new Map<string, ChordFrequencyRow>();
    for (const row of rows as ChordFrequencyRow[]) {
        byUrl.set(row.url, row);
    }
    return byUrl;
};

const migrate = async () => {
    const legacyChords = await getLegacyChords();
    const frequencyByUrl = await getChordFrequencyByUrl();

    let inserted = 0;
    let skipped = 0;

    for (const chord of legacyChords) {
        const frequency = frequencyByUrl.get(chord.url);
        const visitsCount = frequency?.count ?? 0;
        const lastAccessDateUnix = frequency?.lastAccessDateUnix ?? null;
        const creationDateUnix = Math.floor(chord.creationDate / 1000);

        try {
            await db.query(
                `INSERT INTO Chord (artist, title, url, tags, creationDateUnix, visitsCount, lastAccessDateUnix)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    chord.artist,
                    chord.title,
                    chord.url,
                    JSON.stringify(chord.tags),
                    creationDateUnix,
                    visitsCount,
                    lastAccessDateUnix
                ]
            );
            inserted++;
        } catch (error) {
            console.error(`Skipping chord with url "${chord.url}":`, error);
            skipped++;
        }
    }

    console.log(`Chords migration done. Inserted: ${inserted}, skipped: ${skipped}`);
};

await migrate();
```

- [ ] **Step 2: Build the script**

Run: `npm run build`
Expected: `dist/src/tools/chords/migrate-chords-from-s3.js` exists, no compile errors.

- [ ] **Step 3: Verify the script manually against local dev data (does not run in CI/tests)**

With the local dev environment running (`npm run env`, DB initialized via `./src/tools/init-db.sh`), run:
`node dist/src/tools/chords/migrate-chords-from-s3.js`
Expected: a `Chords migration done. Inserted: N, skipped: 0` line, where N matches the number of entries in the local `songbook/index.json` seed (8, per `src/libs/databases/s3.ts`'s `requiredFiles` seed data).

- [ ] **Step 4: Commit**

```bash
git add src/tools/chords/migrate-chords-from-s3.ts
git commit -m "chords: add one-off migration script from S3+ChordFrequency to Chord table"
```

---

## Post-plan notes (not part of this plan's scope)

- The frontend consumes `getAll` (new field names/shape), and calls to the now-deleted `updateAll`/`getLinksVisitsCount` endpoints and the new `addEntry` endpoint - these need a corresponding frontend change, tracked separately.
- `ChordFrequency` table itself is left in the database; drop it manually once the migration has been run in production and confirmed correct.
