# Songbook Frontend Migration to Chord-in-DB Backend

## Context

The backend moved the `chords` feature from an S3 JSON blob + `ChordFrequency` table to a single `Chord` MySQL table (see `back/superpowers/plans/2026-07-22-chords-db-migration.md`). As a result:

- `POST /chords/updateAll` (bulk replace) and `GET /chords/getLinksVisitsCount` are removed.
- `POST /chords/addEntry` (single-entry create) is added.
- `GET /chords/getAll` now returns the full `Chord` row per entry: `{ id, artist, title, url, tags, creationDateUnix, visitsCount, lastAccessDateUnix }` — visit tracking data that used to require a separate call is now embedded directly.
- `creationDateUnix` is in **seconds** (the old S3-era `creationDate` field was in **milliseconds**).

This spec covers the corresponding frontend changes in `front/src/lib/Songbook/` and `front/src/routes/(apps)/songbook/`.

## Goals

- Adapt all API calls to the new SDK shape (`addEntry` instead of `updateAll`, no more `getLinksVisitsCount`, richer `getAll` rows).
- Rework the `/songbook/edit` page: keep "Add a song", drop "Upload", replace the `svelte-jsoneditor` view with a read-only table of DB entries.
- Remove the `svelte-jsoneditor` dependency entirely.

## Non-goals

- No inline editing/deleting of chords from the edit page (read-only table only).
- No changes to how `addLinkVisit` failure retries work (`failedVisitCounts` store logic untouched).
- No changes to the songbook display views' filtering/search UX.

## Design

### 1. Types & API layer (`src/lib/Songbook/`)

**`types.ts`**

- `RawChord` is redefined to match the backend `Chord` row exactly:
    ```ts
    export type RawChord = {
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
- `Chord = RawChord & { type: FilterType }` — shape unchanged, just inherits the new `RawChord` fields.
- `ChordVisitItem` type is deleted (no longer fetched as a separate resource).
- `ChordMetadata` (`{ count: number; lastAccessDateUnix: number }`) is kept unchanged — it's the shape held by `visitCountsStore`.
- `LinksChecks.fails[].chord` keeps type `RawChord` (automatically picks up the richer shape; only `artist`/`title`/`url` are actually read by `ChordsChecks.svelte`).

**`api.ts`**

- Remove `getLinksVisitsCount` (`client2.chords.getLinksVisitsCount` no longer exists).
- Remove `uploadChords` (was `client2.chords.updateAll`, removed).
- Add `addChord = client2.chords.addEntry`.
- `getChords`, `getSongbook`, `uploadLinkVisit` stay as-is, now typed against the new `RawChord`.

**`service.ts`**

- `uploadNewChord`'s ajv schema drops the `creationDate` field/requirement — the new schema requires only `artist`, `title`, `url`, `tags` (matching `addEntry`'s input schema).
- Logic simplifies from "fetch existing chords, prepend new one, upload whole list" to a single `addChord({ artist, title, url, tags })` call.
- Error handling in the catch block is extended to map `ITEM_ALREADY_EXISTS` (via `Chords_AddEntry_Errors`) to a toast like "A song with this URL already exists", alongside existing `UNAUTHORIZED`/network/server error handling (matching the pattern previously used in `edit/+page.svelte`'s old `upload()`).

### 2. Main `/songbook` page — visit counts & dates

- `visitCountsStore` (`store.ts`) and all its subscribers (`ChordLink.svelte`, `ListByVisitsCounts.svelte`, `ListByAccessDate.svelte`) are **unchanged** in structure.
- `+page.svelte`'s `onMount` no longer calls the removed `getLinksVisitsCount()`. Instead it builds the `Map<string, ChordMetadata>` directly from the already-loaded `chords` array:
    ```ts
    const counts = new Map<string, ChordMetadata>(
        chords.map((chord) => [
            chord.url,
            { count: chord.visitsCount, lastAccessDateUnix: chord.lastAccessDateUnix ?? 0 }
        ])
    );
    visitCountsStore.set(counts);
    ```
- The `failedVisitCounts` retry loop (uploading missed `addLinkVisit` calls after login) is unchanged.
- `LatestAdditions.svelte`: rename `creationDate` → `creationDateUnix` throughout. Since `now`/`oneweek`/`onemonth`/etc. constants are in milliseconds, comparisons become `chord.creationDateUnix * 1000` vs those constants. Filtering on truthiness (`.filter((c) => c.creationDate)`) becomes `.filter((c) => c.creationDateUnix)`.

### 3. Edit page redesign (`songbook/edit/`)

**`+page.svelte`**

- Remove all `svelte-jsoneditor` usage: the `JSONEditor`/`Mode`/`createAjvValidator`/`JSONContent` imports, the `schema`/`validator` consts, `editor` state, `isValid`/`onJsonChange`, and the `upload()` function + "Upload" button.
- Keep the "Add a song" button (`AuthGuard` wrapping a button navigating to `/songbook/edit/create`) unchanged.
- Replace the editor with a plain read-only `<table>` listing every chord returned by `getAll`, with columns:
    - Artist
    - Title
    - URL (rendered as a link, opens in new tab)
    - Tags (comma-joined)
    - Created (formatted from `creationDateUnix`)
    - Visits (`visitsCount`)
    - Last access (formatted from `lastAccessDateUnix`, or "—" if null)
- Rows sorted by `creationDateUnix` descending (most recent first).
- No search, filtering, or inline editing.

**`+page.ts`**

- Same `getChords()` call; return type updated to `{ chords: RawChord[] }` using the new `RawChord`.

**`create/+page.svelte`** and **`edit/components/ChordForm.svelte`**

- Form fields (artist/title/url/tags) and client-side validation (`validateTitle`/`validateArtist`/`validateUrl`) stay as-is.
- The payload construction drops `creationDate: Date.now()` (the backend now sets `creationDateUnix` server-side) — it becomes `{ artist, title, url, tags: tagList }`.
- Calls the simplified `uploadNewChord` from `service.ts` (which now calls `addChord` under the hood); `onUpload` callback / navigation-back-to-edit behavior is unchanged.

### 4. Cleanup

- Remove `svelte-jsoneditor` from `front/package.json` dependencies — its only usage in the codebase is the file being rewritten in section 3.

## Testing / Verification

- `npm run check` (svelte-check + lint + prettier) must pass.
- Manual verification in dev (per project convention, frontend changes should be exercised in a browser): load `/songbook`, confirm views/sorting/tooltips still work; load `/songbook/edit`, confirm the table renders DB entries and "Add a song" still works end-to-end against the new `addEntry` endpoint; confirm duplicate-URL submission shows the `ITEM_ALREADY_EXISTS` toast.
