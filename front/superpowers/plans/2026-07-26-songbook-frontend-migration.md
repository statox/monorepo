# Songbook Frontend Migration to Chord-in-DB Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt `front/src/lib/Songbook/` and `front/src/routes/(apps)/songbook/` to the new `Chord`-in-database backend API (new `addEntry` endpoint, removed `updateAll`/`getLinksVisitsCount`, richer `getAll` rows), and replace the `/songbook/edit` page's `svelte-jsoneditor` bulk-edit UI with a read-only table plus the existing single-song add flow.

**Architecture:** `src/lib/Songbook/` (types/api/service) is the single integration point with the backend SDK and is updated first, bottom-up. Route files (`+page.svelte`/`+page.ts` and components under `songbook/`) are then updated to consume the new types/functions. The edit page's JSON editor is deleted and replaced with a plain read-only table; `svelte-jsoneditor` is removed from `package.json` last, once nothing imports it.

**Tech Stack:** SvelteKit 5 (Svelte 5 runes), TypeScript strict mode, `json-schema-to-ts` + `ajv` for schema-derived types, Luxon for date formatting, auto-generated `statox-api` SDK.

## Global Constraints

- Run all `npm` commands from `front/`, never from the repo root.
- Use the `"scripts"` section of `front/package.json` for lint/format/check/build (`npm run check`, `npm run lint`, `npm run prettier`, `npm run build`).
- SvelteKit static-site pattern: page loaders that call the API must keep `export const ssr = false;` to avoid calling the API at build time (already present in both `songbook/+page.ts` and `songbook/edit/+page.ts` — do not remove it).
- No test framework exists for `front/` (no `*.test.*` files) — verification is `npm run check`, `npm run lint`, `npm run prettier`, `npm run build`, plus manual verification in the dev server browser for the two pages touched (`/songbook` and `/songbook/edit`).
- Never run `git commit` without giving the user the command first, unless the user has explicitly granted commit permission for the session (already granted for this plan).
- ES import paths in this project do not use explicit extensions (Vite/SvelteKit resolves `.ts`/`.svelte` automatically) — do not add `.js` extensions to imports here (that convention is backend-only).

---

### Task 1: Update `src/lib/Songbook/types.ts` for the new `Chord` shape

**Files:**

- Modify: `front/src/lib/Songbook/types.ts`

**Interfaces:**

- Produces: `RawChord` type `{ id: number; artist: string; title: string; url: string; tags: string[]; creationDateUnix: number; visitsCount: number; lastAccessDateUnix: number | null }`, `Chord = RawChord & { type: FilterType }`, `ChordMetadata` unchanged, `LinksChecks` unchanged (its `chord: RawChord` field now resolves to the new shape). `ChordVisitItem` is removed.

- [ ] **Step 1: Replace the type definitions**

Replace the full content of `front/src/lib/Songbook/types.ts`:

```ts
export type FilterType = 'link' | 'doc' | 'pdf' | 'youtube';

export type Filters = Record<FilterType, boolean>;

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

export type Chord = RawChord & {
    type: FilterType;
};

export type ChordMetadata = {
    count: number;
    lastAccessDateUnix: number;
};

export type LinksChecks = {
    nbChecks: number;
    nbSkipped: number;
    fails: {
        status: string;
        error?: any;
        chord: RawChord;
    }[];
    nbFails: number;
    timestamp: number;
};
```

- [ ] **Step 2: Verify the change compiles in isolation**

Run: `cd front && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "Songbook/types" || echo "no errors in types.ts"`
Expected: `no errors in types.ts` (errors in files that consume the old shape are expected at this point and are fixed in later tasks — do not try to fix them here).

- [ ] **Step 3: Commit**

```bash
git add front/src/lib/Songbook/types.ts
git commit -m "songbook: update RawChord/Chord types for DB-backed Chord shape"
```

---

### Task 2: Update `src/lib/Songbook/api.ts` to the new SDK surface

**Files:**

- Modify: `front/src/lib/Songbook/api.ts`

**Interfaces:**

- Consumes: `client2` from `$lib/api`, `RawChord`/`Chord` from `./types` (Task 1).
- Produces: `getChords` (unchanged, `client2.chords.getAll`), `getSongbook(): Promise<Chord[]>` (unchanged logic, new field types flow through), `addChord = client2.chords.addEntry`, `getLinksChecks` (unchanged), `uploadLinkVisit` (unchanged). `getLinksVisitsCount` and `uploadChords` are removed.

- [ ] **Step 1: Rewrite the file**

Replace the full content of `front/src/lib/Songbook/api.ts`:

```ts
import { client2 } from '$lib/api';
import type { Chord, RawChord } from './types';

const getType = (chord: RawChord) => {
    const url = chord.url;
    if (url.includes('.doc')) {
        return 'doc';
    }
    if (url.includes('.pdf')) {
        return 'pdf';
    }
    if (url.includes('youtube')) {
        return 'youtube';
    }
    return 'link';
};

export const getChords = client2.chords.getAll;

export const getSongbook = async (): Promise<Chord[]> => {
    const chords = await getChords();

    return chords.map((chord: RawChord) => {
        return {
            ...chord,
            type: getType(chord)
        };
    });
};

export const getLinksChecks = client2.chords.checkLinks;

export const addChord = client2.chords.addEntry;

export const uploadLinkVisit = client2.chords.addLinkVisit;
```

- [ ] **Step 2: Type-check**

Run: `cd front && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "Songbook/api" || echo "no errors in api.ts"`
Expected: `no errors in api.ts`

- [ ] **Step 3: Commit**

```bash
git add front/src/lib/Songbook/api.ts
git commit -m "songbook: replace updateAll/getLinksVisitsCount with addEntry in api layer"
```

---

### Task 3: Update `src/lib/Songbook/service.ts` to call `addChord` directly

**Files:**

- Modify: `front/src/lib/Songbook/service.ts`

**Interfaces:**

- Consumes: `addChord` from `./api` (Task 2), `ApiError` from `$lib/api`, `Chords_AddEntry_Errors` from `statox-api`.
- Produces: `ChordData` type `{ artist: string; title: string; url: string; tags: string[] }`, `uploadNewChord(newChord: ChordData): Promise<void>` — validates then calls `addChord`; on failure shows a toast and does not rethrow (matches existing behavior for the old bulk-upload path).

- [ ] **Step 1: Rewrite the file**

Replace the full content of `front/src/lib/Songbook/service.ts`:

```ts
import Ajv from 'ajv';
import type { FromSchema } from 'json-schema-to-ts';
import { ApiError } from '$lib/api';
import { toast } from '$lib/components/Toast';
import { addChord } from '$lib/Songbook';
import type { Chords_AddEntry_Errors } from 'statox-api';

const chordSchema = {
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

// Derive TypeScript type from schema
export type ChordData = FromSchema<typeof chordSchema>;

// Setup AJV validator
const ajv = new Ajv();
const validateData = ajv.compile(chordSchema);

// Validation helper functions
function validateChordData(data: unknown): asserts data is ChordData {
    if (!validateData(data)) {
        const errors = ajv.errorsText(validateData.errors);
        throw new Error(`Invalid Songbook data: ${errors}`);
    }
}

export const uploadNewChord = async (newChord: ChordData) => {
    try {
        validateChordData(newChord);
    } catch (error) {
        const message = `<strong>Validation Error</strong><br/> ${(error as Error).message}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
        throw error;
    }

    try {
        await addChord(newChord);
    } catch (error) {
        let errorMessage = (error as Error).message;
        if (error instanceof ApiError) {
            const e = error as ApiError<Chords_AddEntry_Errors>;
            if (e.code === 'ITEM_ALREADY_EXISTS') {
                errorMessage = 'A song with this URL already exists';
            } else if (e.code === 'UNAUTHORIZED') {
                errorMessage = 'Invalid logged in user';
            } else if (e.code === 'INVALID_SCOPE') {
                errorMessage = 'Invalid scope';
            } else if (e.code === 'FORBIDDEN_FOR_USER') {
                errorMessage = 'Forbidden for user';
            } else if (e.code === 'NETWORK_ERROR') {
                errorMessage = 'API unreachable';
            } else if (e.code === 'INTERNAL_SERVER_ERROR') {
                errorMessage = 'Server error';
            }
        }
        const message = `<strong>Entry not created</strong><br/> ${errorMessage}`;
        toast.push(message, {
            theme: {
                '--toastBarBackground': '#FF0000'
            }
        });
    }
};
```

Note: this drops the previous "fetch existing chords, prepend the new one, upload the whole list" logic — `addEntry` is a single-row insert, so `uploadNewChord` only needs to call `addChord` with the new entry.

- [ ] **Step 2: Type-check**

Run: `cd front && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "Songbook/service" || echo "no errors in service.ts"`
Expected: `no errors in service.ts`

- [ ] **Step 3: Commit**

```bash
git add front/src/lib/Songbook/service.ts
git commit -m "songbook: simplify uploadNewChord to call addEntry directly"
```

---

### Task 4: Update `ChordForm.svelte` and the create page to drop `creationDate`

**Files:**

- Modify: `front/src/routes/(apps)/songbook/edit/components/ChordForm.svelte`

**Interfaces:**

- Consumes: `uploadNewChord`, `ChordData` from `$lib/Songbook` (Task 3).

- [ ] **Step 1: Update the payload construction and import**

In `front/src/routes/(apps)/songbook/edit/components/ChordForm.svelte`, change the import on line 10 from:

```ts
import { uploadNewChord, type RawChord } from '$lib/Songbook';
```

to:

```ts
import { uploadNewChord, type ChordData } from '$lib/Songbook';
```

Then change the `upload` function's payload construction (currently):

```ts
const tagList = tags ? tags.replaceAll(' ', '').split(',') : [];
const newChord: RawChord = { title, artist, url, tags: tagList, creationDate: Date.now() };
```

to:

```ts
const tagList = tags ? tags.replaceAll(' ', '').split(',') : [];
const newChord: ChordData = { title, artist, url, tags: tagList };
```

No other changes to this file — the rest of the validation logic, template, and styles are unchanged.

- [ ] **Step 2: Type-check**

Run: `cd front && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "ChordForm" || echo "no errors in ChordForm.svelte"`
Expected: `no errors in ChordForm.svelte`

- [ ] **Step 3: Commit**

```bash
git add "front/src/routes/(apps)/songbook/edit/components/ChordForm.svelte"
git commit -m "songbook: drop client-side creationDate from add-song form payload"
```

---

### Task 5: Rework the main `/songbook` page's visit-count sourcing

**Files:**

- Modify: `front/src/routes/(apps)/songbook/+page.svelte`

**Interfaces:**

- Consumes: `Chord`, `ChordMetadata`, `Filters`, `FilterType`, `uploadLinkVisit` from `$lib/Songbook`; `visitCountsStore`, `failedVisitCounts` from `./store` (unchanged).
- Produces: `visitCountsStore` is now populated from the already-loaded `chords` array instead of a separate API call.

- [ ] **Step 1: Update the imports**

In `front/src/routes/(apps)/songbook/+page.svelte`, change the top import block from:

```ts
import {
    getLinksVisitsCount,
    uploadLinkVisit,
    type Chord,
    type ChordVisitItem,
    type Filters,
    type FilterType
} from '$lib/Songbook';
```

to:

```ts
import {
    uploadLinkVisit,
    type Chord,
    type ChordMetadata,
    type Filters,
    type FilterType
} from '$lib/Songbook';
```

- [ ] **Step 2: Replace the visit-counts fetch in `onMount`**

Replace this block (the second `try`/`catch` inside `onMount`):

```ts
try {
    const countsData = await getLinksVisitsCount();
    const counts = countsData.reduce(
        (counts: Map<string, ChordVisitItem>, count: ChordVisitItem) => {
            counts.set(count.url, {
                ...count
            });
            return counts;
        },
        new Map()
    );

    visitCountsStore.set(counts);
} catch (_error) {
    enqueueNoticeMessage({ level: 'error', header: 'Couldnt upload failed visit counts' });
}
```

with:

```ts
const counts = new Map<string, ChordMetadata>(
    chords.map((chord) => [
        chord.url,
        { count: chord.visitsCount, lastAccessDateUnix: chord.lastAccessDateUnix ?? 0 }
    ])
);
visitCountsStore.set(counts);
```

This removes the now-unneeded `try`/`catch` since building the map from already-loaded data cannot fail at runtime the way a network call could.

- [ ] **Step 3: Type-check**

Run: `cd front && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "songbook/+page" || echo "no errors in songbook/+page.svelte"`
Expected: `no errors in songbook/+page.svelte`

- [ ] **Step 4: Commit**

```bash
git add "front/src/routes/(apps)/songbook/+page.svelte"
git commit -m "songbook: source visit counts from getAll instead of getLinksVisitsCount"
```

---

### Task 6: Rename `creationDate` to `creationDateUnix` in `LatestAdditions.svelte`

**Files:**

- Modify: `front/src/routes/(apps)/songbook/components/LatestAdditions.svelte`

**Interfaces:**

- Consumes: `Chord` from `$lib/Songbook` (Task 1's new shape, `creationDateUnix` in seconds).

- [ ] **Step 1: Update the date comparisons**

In `front/src/routes/(apps)/songbook/components/LatestAdditions.svelte`, replace the `chordsWithTags` derivation (currently using `c.creationDate` in milliseconds) with the seconds-to-milliseconds conversion:

```ts
const chordsWithTags: ChordWithTags[] = $derived(
    chords
        .filter((c) => c.creationDateUnix)
        .sort((a, b) => {
            return b.creationDateUnix - a.creationDateUnix;
        })
        .map((chord, index, chords) => {
            const r = {
                ...chord
            } as ChordWithTags;
            if (index > 0) {
                const prev = chords[index - 1];
                for (const { time, label } of timeSteps) {
                    if (
                        prev.creationDateUnix * 1000 > time &&
                        chord.creationDateUnix * 1000 < time
                    ) {
                        r.dateTag = label;
                    }
                }
            }
            return r;
        })
);
```

Note the `.sort()` comparator intentionally keeps comparing raw `creationDateUnix` values (both operands are in the same unit, seconds, so no conversion is needed there — only the `timeSteps` comparison, which uses millisecond-based `time` values from `Date.now()`, needs the `* 1000` conversion).

- [ ] **Step 2: Type-check**

Run: `cd front && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "LatestAdditions" || echo "no errors in LatestAdditions.svelte"`
Expected: `no errors in LatestAdditions.svelte`

- [ ] **Step 3: Commit**

```bash
git add "front/src/routes/(apps)/songbook/components/LatestAdditions.svelte"
git commit -m "songbook: use creationDateUnix (seconds) in LatestAdditions"
```

---

### Task 7: Rewrite the edit page (`+page.ts` and `+page.svelte`) — drop JSON editor, add read-only table

**Files:**

- Modify: `front/src/routes/(apps)/songbook/edit/+page.ts`
- Modify: `front/src/routes/(apps)/songbook/edit/+page.svelte`

**Interfaces:**

- Consumes: `getChords`, `RawChord` from `$lib/Songbook` (Tasks 1-2).
- Produces: `/songbook/edit` page load returns `{ chords: RawChord[] }`; page renders "Add a song" button (unchanged behavior) and a read-only table of all chords sorted by `creationDateUnix` descending. No "Upload" button, no JSON editor.

- [ ] **Step 1: Update `+page.ts`**

Replace the full content of `front/src/routes/(apps)/songbook/edit/+page.ts`:

```ts
import { getChords, type RawChord } from '$lib/Songbook';
import type { PageLoad } from './$types';

export const ssr = false; // Avoid calling API's /chords/getAll at build time
export const load: PageLoad = async (): Promise<{ chords: RawChord[] }> => {
    try {
        const chords = await getChords();
        return { chords };
    } catch {
        return { chords: [] };
    }
};
```

(This file's content is unchanged from before — `RawChord` already carries the new shape from Task 1. Confirming it here so the task is self-contained.)

- [ ] **Step 2: Rewrite `+page.svelte`**

Replace the full content of `front/src/routes/(apps)/songbook/edit/+page.svelte`:

```svelte
<script lang="ts">
    import { DateTime } from 'luxon';
    import type { RawChord } from '$lib/Songbook';

    import { goto } from '$app/navigation';
    import { AuthGuard } from '$lib/components/AuthGuard';

    interface Props {
        // From +page.ts load() function
        data: { chords: RawChord[] };
    }

    let { data }: Props = $props();
    let { chords } = $derived(data);

    const sortedChords = $derived(
        [...chords].sort((a, b) => b.creationDateUnix - a.creationDateUnix)
    );

    const formatDate = (dateUnix: number | null) => {
        if (dateUnix === null) {
            return '—';
        }
        return DateTime.fromSeconds(dateUnix).toLocaleString(DateTime.DATETIME_MED);
    };
</script>

<h2>
    Edit song book

    <span class="pull-right">
        <button style:position="relative" onclick={() => goto('/songbook')}>
            Back to songbook
        </button>
    </span>
</h2>

<AuthGuard message="Login to add a new song" requiredScope="admin">
    <button style:position="relative" onclick={() => goto('/songbook/edit/create')}>
        Add a song
    </button>
</AuthGuard>

{#if sortedChords.length}
    <table>
        <thead>
            <tr>
                <th>Artist</th>
                <th>Title</th>
                <th>URL</th>
                <th>Tags</th>
                <th>Created</th>
                <th>Visits</th>
                <th>Last access</th>
            </tr>
        </thead>
        <tbody>
            {#each sortedChords as chord (chord.id)}
                <tr>
                    <td>{chord.artist}</td>
                    <td>{chord.title}</td>
                    <td>
                        <a href={chord.url} target="_blank" rel="noopener noreferrer">{chord.url}</a
                        >
                    </td>
                    <td>{chord.tags.join(', ')}</td>
                    <td>{formatDate(chord.creationDateUnix)}</td>
                    <td>{chord.visitsCount}</td>
                    <td>{formatDate(chord.lastAccessDateUnix)}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}
```

- [ ] **Step 3: Type-check**

Run: `cd front && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "songbook/edit" || echo "no errors in songbook/edit"`
Expected: `no errors in songbook/edit`

- [ ] **Step 4: Commit**

```bash
git add "front/src/routes/(apps)/songbook/edit/+page.ts" "front/src/routes/(apps)/songbook/edit/+page.svelte"
git commit -m "songbook: replace JSON editor with read-only chords table on edit page"
```

---

### Task 8: Remove the `svelte-jsoneditor` dependency

**Files:**

- Modify: `front/package.json`

**Interfaces:**

- None — this is a dependency cleanup with no code interface.

- [ ] **Step 1: Confirm no remaining usages**

Run: `cd front && grep -rn "svelte-jsoneditor" src`
Expected: no output (Task 7 removed the only usage).

- [ ] **Step 2: Remove the dependency**

In `front/package.json`, remove this line from `devDependencies`:

```json
        "svelte-jsoneditor": "^3.12.0",
```

- [ ] **Step 3: Reinstall to update the lockfile**

Run: `cd front && npm install`
Expected: completes without error; `svelte-jsoneditor` is removed from `front/package-lock.json` (or the repo's lockfile).

- [ ] **Step 4: Commit**

```bash
git add front/package.json front/package-lock.json
git commit -m "songbook: remove unused svelte-jsoneditor dependency"
```

---

### Task 9: Full verification pass

**Files:**

- None created/modified directly — verification-only task.

- [ ] **Step 1: Type-check, lint, and format check**

Run: `cd front && npm run check && npm run lint && npm run prettier`
Expected: no errors. If lint/format fail, run `npm run lint:fix` and `npm run prettier:fix`, then re-run `npm run check && npm run lint && npm run prettier`.

- [ ] **Step 2: Production build**

Run: `cd front && npm run build`
Expected: build completes without error (confirms no leftover references to removed exports like `getLinksVisitsCount`/`uploadChords`/`ChordVisitItem`, and that `svelte-jsoneditor`'s removal doesn't break the build).

- [ ] **Step 3: Manual browser verification of `/songbook`**

Start the dev server (`npm run dev` from `front/`, if not already running) and in a browser:

- Load `/songbook`. Confirm the chord list renders, the "By frequency" and "By access date" views show visit counts/sort correctly, and "Latest additions" shows recent entries in the right order.
- Click a chord link and confirm the visit is recorded (tooltip on hover shows updated visit count after re-hovering, or check via `/songbook/edit` after a refresh).

- [ ] **Step 4: Manual browser verification of `/songbook/edit`**

In the browser, logged in with `admin` scope:

- Load `/songbook/edit`. Confirm it shows "Add a song" (no "Upload" button) and a table listing all chords with Artist/Title/URL/Tags/Created/Visits/Last access columns, sorted newest-first.
- Click "Add a song", submit a new entry, confirm it appears in the table after navigating back.
- Attempt to add a duplicate URL and confirm the "A song with this URL already exists" toast appears.

- [ ] **Step 5: Commit if any fixes were needed**

If Steps 1-4 required fixes, stage and commit them:

```bash
git add -A
git commit -m "songbook: fix issues found during verification pass"
```

(Skip this step if no fixes were needed.)
