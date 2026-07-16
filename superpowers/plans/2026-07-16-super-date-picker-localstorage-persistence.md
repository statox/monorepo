# SuperDatePicker localStorage Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the time range selected in `SensorsHistogram`'s `SuperDatePicker` to `localStorage`, restoring it on next mount (falling back to a default), via a reusable helper that keys independently per usage site.

**Architecture:** `SuperDatePicker.svelte` (shared package) starts reporting the committed datemath strings (`start`/`end`) in its `onTimeChange` callback, in addition to the resolved milliseconds it already reports. A new thin wrapper in `front/` (`persistedDurationRange`) combines this with the existing generic `localStore` helper to persist a `DurationRange` under a namespaced key. `SensorsHistogram.svelte` is updated to read its initial range from this persisted store and write back to it on every change.

**Tech Stack:** Svelte 5 (runes), TypeScript, Vitest (package-level tests), svelte-check (front-level type checking). No new dependencies.

## Global Constraints

- Every change in a backend route requires SDK regen — not applicable here, no backend routes touched.
- Never run `git commit` yourself — each task's commit step is a command for the user to run; do not execute it.
- Run npm commands only inside `back/`, `front/`, or `packages/svelte-super-date-picker/` — never at the repo root.
- Use each package's own `package.json` `scripts` section for lint/format/build/test — do not invent ad-hoc commands.
- Persisted value shape is `DurationRange` (datemath strings `{ start, end }`), not resolved milliseconds — relative ranges (e.g. `'now-1h'`) must re-anchor to current time on reload, per the approved design.
- `SuperDatePicker.svelte` itself must remain localStorage-unaware — persistence lives entirely in `front/`.
- `SensorsHistogram` uses a hardcoded internal storage key (`'home-tracker-sensors-histogram'`), not a `storageKey` prop — YAGNI, it's only rendered once per page today.

---

### Task 1: Expose committed datemath strings from `SuperDatePicker`'s `onTimeChange`

**Files:**
- Modify: `packages/svelte-super-date-picker/src/types.ts`
- Modify: `packages/svelte-super-date-picker/src/SuperDatePicker.svelte:74-104`

**Interfaces:**
- Consumes: existing `DurationRange { start: ShortDate; end: ShortDate; label?: string }`, existing `TimeRangeMs { startDateMs: Milliseconds; endDateMs: Milliseconds }`.
- Produces: `OnTimeChangeProps` now includes `start: ShortDate` and `end: ShortDate` (the datemath strings actually committed), consumed by Task 4.

**Context:** `OnTimeChangeProps` currently only carries resolved `startDateMs`/`endDateMs` plus `isInvalid`/`isQuickSelection`. The component tracks the datemath strings (`start`/`end`) internally as `$state` but never reports them. There is no component-testing harness in this repo (no `@testing-library/svelte` or similar in `packages/svelte-super-date-picker/package.json`), so this change is verified via the package's existing `date-math`/type-level test suite (regression) plus `svelte-check`/`tsc`-level type checking and the manual browser verification in Task 5 — adding a new component-testing harness for this one change would be scope creep.

- [ ] **Step 1: Add `start`/`end` to `OnTimeChangeProps`**

In `packages/svelte-super-date-picker/src/types.ts`, change:

```ts
export interface OnTimeChangeProps extends TimeRangeMs {
    isInvalid: boolean;
    isQuickSelection: boolean;
}
```

to:

```ts
export interface OnTimeChangeProps extends TimeRangeMs {
    start: ShortDate;
    end: ShortDate;
    isInvalid: boolean;
    isQuickSelection: boolean;
}
```

- [ ] **Step 2: Run the package's existing test suite to confirm nothing is broken by the type change**

Run: `cd packages/svelte-super-date-picker && npm run tests`
Expected: all existing suites still PASS (this step only adds a field to an interface; no runtime behavior changes yet, so no test should fail — if the TypeScript compiler used by vitest reports a missing-field error anywhere, that confirms the type change is wired correctly and is expected to be fixed by Step 3).

- [ ] **Step 3: Update the three `onTimeChange` call sites in `SuperDatePicker.svelte`**

In `packages/svelte-super-date-picker/src/SuperDatePicker.svelte`, update `setRange`, `applyQuickTime`, and `applyTime`:

```ts
    const setRange = (range: DurationRange) => {
        start = range.start;
        end = range.end;
        if (!showUpdateButton) {
            const millisRange = toMillisRange(start, end);
            if (!millisRange) return;
            committedRange = range;
            onTimeChange({ ...millisRange, start, end, isQuickSelection: false, isInvalid });
        }
    };

    const applyQuickTime = (range: DurationRange) => {
        start = range.start;
        end = range.end;
        showPretty = showPrettyDuration(range.start, range.end, commonlyUsedRanges);
        const millisRange = toMillisRange(range.start, range.end);
        if (!millisRange) return;
        committedRange = range;
        onTimeChange({
            ...millisRange,
            start,
            end,
            isQuickSelection: true,
            isInvalid: false
        });
    };

    const applyTime = () => {
        const millisRange = toMillisRange(start, end);
        if (!millisRange) return;
        onTimeChange({ ...millisRange, start, end, isQuickSelection: false, isInvalid: false });
        committedRange = { start, end };
    };
```

- [ ] **Step 4: Type-check the package**

Run: `cd packages/svelte-super-date-picker && npm run check`
Expected: PASS (lint + prettier; this package has no standalone `tsc` script, but `npm run tests` under vitest already type-checks via `vite-node`/esbuild — rerun it too)

Run: `cd packages/svelte-super-date-picker && npm run tests`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/svelte-super-date-picker/src/types.ts packages/svelte-super-date-picker/src/SuperDatePicker.svelte
git commit -m "feat(svelte-super-date-picker): report committed datemath strings in onTimeChange"
```

---

### Task 2: Export `toMillisRange` from the package's public API

**Files:**
- Modify: `packages/svelte-super-date-picker/src/index.ts`

**Interfaces:**
- Consumes: existing `toMillisRange(start: ShortDate, end: ShortDate, opts?: { now?: DateTime }): { startDateMs: number; endDateMs: number } | null` from `./date-math.js` (already implemented and tested in `date-math.test.ts`).
- Produces: `toMillisRange` is now importable as `import { toMillisRange } from 'svelte-super-date-picker'`, consumed by Task 4.

- [ ] **Step 1: Add the export**

In `packages/svelte-super-date-picker/src/index.ts`, change:

```ts
export {
    parse,
    getDateMode,
    isRelativeToNow,
    toAbsoluteString,
    toRelativeString
} from './date-math.js';
```

to:

```ts
export {
    parse,
    getDateMode,
    isRelativeToNow,
    toAbsoluteString,
    toRelativeString,
    toMillisRange
} from './date-math.js';
```

- [ ] **Step 2: Verify the package still lints/type-checks/tests cleanly**

Run: `cd packages/svelte-super-date-picker && npm run check && npm run tests`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/index.ts
git commit -m "feat(svelte-super-date-picker): export toMillisRange from package entrypoint"
```

---

### Task 3: Add the shared `persistedDurationRange` helper in `front/`

**Files:**
- Create: `front/src/lib/components/SuperDatePicker/persistedRange.svelte.ts`

**Interfaces:**
- Consumes: `localStore<T>(key: string, value: T)` from `front/src/lib/localStore.svelte.ts` (returns a `LocalStore<T>` with reactive `.value`, auto-synced to `localStorage`); `DurationRange` type from `svelte-super-date-picker`.
- Produces: `persistedDurationRange(storageKey: string, defaultRange: DurationRange): LocalStore<DurationRange>`, consumed by Task 4. The returned object's `.value` is a reactive `DurationRange`; assigning to `.value` persists it.

**Context:** This is a 3-line pass-through over the existing, already-relied-upon `localStore` helper (used elsewhere in the app, e.g. `src/routes/(apps)/p5-terrain/+page.svelte`). It fixes the localStorage key prefix (`super-date-picker:`) and the stored shape (`DurationRange`) so every future consumer of this pattern is consistent. No dedicated test file is added for it — front has no test runner configured (`front/package.json` has no `test`/`vitest` script), and its correctness is fully covered by exercising it through `SensorsHistogram` in Task 4's manual verification.

- [ ] **Step 1: Create the helper file**

```ts
// front/src/lib/components/SuperDatePicker/persistedRange.svelte.ts
import { localStore } from '$lib/localStore.svelte';
import type { DurationRange } from 'svelte-super-date-picker';

export function persistedDurationRange(storageKey: string, defaultRange: DurationRange) {
    return localStore<DurationRange>(`super-date-picker:${storageKey}`, defaultRange);
}
```

- [ ] **Step 2: Type-check the front app**

Run: `cd front && npm run check`
Expected: PASS (this new file isn't imported anywhere yet, but `svelte-check` will still parse and type-check it in place)

- [ ] **Step 3: Commit**

```bash
git add front/src/lib/components/SuperDatePicker/persistedRange.svelte.ts
git commit -m "feat(front): add persistedDurationRange helper for SuperDatePicker localStorage persistence"
```

---

### Task 4: Wire persistence into `SensorsHistogram.svelte`

**Files:**
- Modify: `front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte`

**Interfaces:**
- Consumes: `persistedDurationRange` from Task 3; `toMillisRange`, `DurationRange`, `OnTimeChangeProps` from `svelte-super-date-picker` (Tasks 1-2); existing `TimeWindow` type and `getHistogramData`/`getSensorsMetadata` from `$lib/HomeTracker`.
- Produces: no new public interface — this is a leaf consumer.

**Context:** Current relevant code (`front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte:23-58`):

```svelte
    // Matches the picker's default start="now-15m" end="now" props below.
    const defaultTimeWindow = (): TimeWindow => {
        const now = Date.now();
        return { startDateMs: now - 15 * 60 * 1000, endDateMs: now };
    };

    let currentTimeWindow = $state<TimeWindow>(defaultTimeWindow());
    // svelte-ignore state_referenced_locally
    let apiData = $state(refreshData(currentTimeWindow));

    const handleRefreshDataEvent = () => {
        apiData = refreshData(currentTimeWindow);
    };
    document.addEventListener('HomeTracker-RefreshData', handleRefreshDataEvent);
    onDestroy(() =>
        document.removeEventListener('HomeTracker-RefreshData', handleRefreshDataEvent)
    );

    const handleTimeChange = (props: OnTimeChangeProps) => {
        if (props.isInvalid) return;
        currentTimeWindow = { startDateMs: props.startDateMs, endDateMs: props.endDateMs };
        apiData = refreshData(currentTimeWindow);
    };
```

and the template (`SensorsHistogram.svelte:63-68`):

```svelte
    <SuperDatePicker
        start="now-15m"
        end="now"
        onTimeChange={handleTimeChange}
        {commonlyUsedRanges}
    />
```

- [ ] **Step 1: Update the imports**

Change:

```ts
import { SuperDatePicker, type OnTimeChangeProps } from 'svelte-super-date-picker';
```

to:

```ts
import {
    SuperDatePicker,
    toMillisRange,
    type DurationRange,
    type OnTimeChangeProps
} from 'svelte-super-date-picker';
import { persistedDurationRange } from '$lib/components/SuperDatePicker/persistedRange.svelte';
```

- [ ] **Step 2: Replace `defaultTimeWindow`/`currentTimeWindow` seeding with the persisted range**

Replace:

```ts
    // Matches the picker's default start="now-15m" end="now" props below.
    const defaultTimeWindow = (): TimeWindow => {
        const now = Date.now();
        return { startDateMs: now - 15 * 60 * 1000, endDateMs: now };
    };

    let currentTimeWindow = $state<TimeWindow>(defaultTimeWindow());
    // svelte-ignore state_referenced_locally
    let apiData = $state(refreshData(currentTimeWindow));
```

with:

```ts
    const defaultRange: DurationRange = { start: 'now-15m', end: 'now' };
    const persistedRange = persistedDurationRange('home-tracker-sensors-histogram', defaultRange);

    // svelte-ignore state_referenced_locally
    const initialMillisRange = toMillisRange(persistedRange.value.start, persistedRange.value.end);
    // svelte-ignore state_referenced_locally
    let currentTimeWindow = $state<TimeWindow>(
        initialMillisRange ?? toMillisRange(defaultRange.start, defaultRange.end)!
    );
    // svelte-ignore state_referenced_locally
    let apiData = $state(refreshData(currentTimeWindow));
```

(The `?? toMillisRange(defaultRange.start, defaultRange.end)!` fallback only matters if a corrupted/manually-edited localStorage value somehow fails to parse as datemath — `defaultRange` itself is always valid, so the non-null assertion is safe.)

- [ ] **Step 3: Persist the range on every change in `handleTimeChange`**

Replace:

```ts
    const handleTimeChange = (props: OnTimeChangeProps) => {
        if (props.isInvalid) return;
        currentTimeWindow = { startDateMs: props.startDateMs, endDateMs: props.endDateMs };
        apiData = refreshData(currentTimeWindow);
    };
```

with:

```ts
    const handleTimeChange = (props: OnTimeChangeProps) => {
        if (props.isInvalid) return;
        currentTimeWindow = { startDateMs: props.startDateMs, endDateMs: props.endDateMs };
        persistedRange.value = { start: props.start, end: props.end };
        apiData = refreshData(currentTimeWindow);
    };
```

- [ ] **Step 4: Update the template to use the persisted range instead of hardcoded props**

Replace:

```svelte
    <SuperDatePicker
        start="now-15m"
        end="now"
        onTimeChange={handleTimeChange}
        {commonlyUsedRanges}
    />
```

with:

```svelte
    <SuperDatePicker
        start={persistedRange.value.start}
        end={persistedRange.value.end}
        onTimeChange={handleTimeChange}
        {commonlyUsedRanges}
    />
```

- [ ] **Step 5: Type-check the front app**

Run: `cd front && npm run check`
Expected: PASS

- [ ] **Step 6: Lint the front app**

Run: `cd front && npm run lint`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add front/src/routes/\(apps\)/home-tracker/components/SensorsHistogram.svelte
git commit -m "feat(home-tracker): persist SensorsHistogram's selected time range to localStorage"
```

---

### Task 5: Manual end-to-end verification in the browser

**Files:** none (verification only)

**Context:** No component-testing harness exists in this repo for either package, so the behavioral guarantee (range survives reload, relative ranges re-anchor, default applies on first visit) can only be confirmed by driving the real app, per the project's `verify` skill guidance.

- [ ] **Step 1: Start the front dev server**

Run: `cd front && npm run dev`
Expected: server starts on the configured HTTPS port (see `front/CLAUDE.md` - dev server runs on HTTPS with a self-signed cert)

- [ ] **Step 2: Verify default behavior on first visit**

In a fresh browser profile (or after clearing `localStorage` for the dev origin), navigate to the Home Tracker history page. Confirm the picker shows "15 minutes ago" and the graphs load data for the last 15 minutes.

- [ ] **Step 3: Verify persistence of a relative range**

Use the picker to select "1 hour ago" via the commonly-used ranges. Reload the page. Confirm the picker still shows "1 hour ago" (not a frozen absolute window) and the graphs refetch for the last hour relative to the new page-load time.

- [ ] **Step 4: Verify persistence of an absolute range**

Use the picker's absolute tab to pick a specific start/end date pair. Reload the page. Confirm the exact same absolute dates are restored in the picker and the graphs show that same window.

- [ ] **Step 5: Inspect localStorage directly**

In devtools Application/Storage tab, confirm a key named `super-date-picker:home-tracker-sensors-histogram` exists and its JSON value matches `{"start": ..., "end": ...}` in datemath/ISO form (not raw millisecond numbers).

- [ ] **Step 6: Report results to the user**

Summarize pass/fail for steps 2-5. If any step fails, stop and use `superpowers:systematic-debugging` before proceeding further - do not patch symptoms ad hoc.

---

## Self-Review Notes

- **Spec coverage:** Task 1 covers spec section 1 (expose datemath), Task 2 covers section 2 (export `toMillisRange`), Task 3 covers section 3 (shared helper), Task 4 covers section 4 (`SensorsHistogram` wiring), Task 5 covers the spec's "Testing" section's manual verification bullets. The spec's package-level automated test suggestion ("extend/add a vitest case asserting `onTimeChange` payloads include `start`/`end`") was reconsidered during planning: since `setRange`/`applyQuickTime`/`applyTime` are inline closures inside a `.svelte` file with no mounting harness available in this repo, an isolated unit test isn't feasible without introducing new test infrastructure (out of scope) - Task 1 instead relies on type-checking plus Task 5's manual verification, which does exercise all three code paths (drag-select via `setRange`/`applyTime`, quick-select via `applyQuickTime`).
- **Placeholder scan:** no TBD/TODO markers; every step has literal code or an exact command with expected output.
- **Type consistency:** `OnTimeChangeProps.start`/`.end` (Task 1) match the `props.start`/`props.end` reads in Task 4's `handleTimeChange`. `persistedDurationRange`'s return type (`LocalStore<DurationRange>`, from Task 3) matches `persistedRange.value.start`/`.end` usage in Task 4. `toMillisRange`'s signature (Task 2, re-exporting the already-implemented/tested `date-math.ts` function) matches its two call sites in Task 4.
