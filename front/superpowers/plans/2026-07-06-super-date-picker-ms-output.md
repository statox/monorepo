# SuperDatePicker ms-output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change `SuperDatePicker`'s `onTimeChange`/`onRefresh` callbacks to report `startDateMs`/`endDateMs` (raw milliseconds) instead of ambiguous `ShortDate` strings, so consumers never need to parse date-math strings themselves.

**Architecture:** Add a `TimeRangeMs` type and a `toMillisRange()` conversion helper inside the `svelte-super-date-picker` package. `SuperDatePicker.svelte` keeps its internal `start`/`end` state as `ShortDate` strings (needed for quick-select/pretty-duration/relative-tab UI) but converts to ms at the two points it calls out to the parent (`onTimeChange`, `onRefresh`). Update the two front-end consumers to drop their own `parse()` calls.

**Tech Stack:** SvelteKit 5 (runes), TypeScript, Luxon, Vitest.

**Spec:** `front/superpowers/specs/2026-07-06-super-date-picker-ms-output-design.md`

---

### Task 1: Add `TimeRangeMs` type and rework `OnTimeChangeProps`/`OnRefreshProps`

**Files:**

- Modify: `packages/svelte-super-date-picker/src/types.ts`

- [ ] **Step 1: Edit `types.ts`**

Replace the `OnTimeChangeProps`/`OnRefreshProps` definitions (currently `types.ts:40-47`) and add `TimeRangeMs`. The full relevant section should read:

```ts
export interface TimeRangeMs {
    startDateMs: Milliseconds;
    endDateMs: Milliseconds;
}

export interface OnTimeChangeProps extends TimeRangeMs {
    isInvalid: boolean;
    isQuickSelection: boolean;
}

export interface OnRefreshProps extends TimeRangeMs {
    refreshInterval: Milliseconds;
}
```

Leave `DurationRange` (the string-based `{ start; end; label? }` type used by `commonlyUsedRanges`/`recentlyUsedRanges`) untouched.

- [ ] **Step 2: Type-check the package**

Run: `cd packages/svelte-super-date-picker && npx tsc --noEmit -p tsconfig.json`

Expected: FAILS — `SuperDatePicker.svelte` still constructs `OnTimeChangeProps`/`OnRefreshProps` with `start`/`end` string fields, which no longer match. This confirms the type change took effect; we'll fix the call sites in Task 2.

- [ ] **Step 3: Commit**

```bash
git add packages/svelte-super-date-picker/src/types.ts
git commit -m "SuperDatePicker - Add TimeRangeMs type, switch callback props to ms"
```

---

### Task 2: Add `toMillisRange()` helper with tests

**Files:**

- Modify: `packages/svelte-super-date-picker/src/date-math.ts`
- Test: `packages/svelte-super-date-picker/src/date-math.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `date-math.test.ts`. First extend the import list at the top of the file to include `toMillisRange`:

```ts
import {
    DATE_MODES,
    INVALID_DATE,
    getDateMode,
    isRelativeToNow,
    parse,
    parseRelativeParts,
    toAbsoluteString,
    toMillisRange,
    toRelativeString,
    toRelativeStringFromParts
} from './date-math.js';
```

Then append this new `describe` block at the end of the file:

```ts
describe('toMillisRange', () => {
    it('converts an absolute range to milliseconds', () => {
        const result = toMillisRange('2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z');
        expect(result).toEqual({
            startDateMs: DateTime.fromISO('2020-01-01T00:00:00.000Z').toMillis(),
            endDateMs: DateTime.fromISO('2020-01-02T00:00:00.000Z').toMillis()
        });
    });

    it('rounds the end up when both start and end are the same relative string', () => {
        const result = toMillisRange('now/d', 'now/d', { now: NOW });
        expect(result).toEqual({
            startDateMs: NOW.startOf('day').toMillis(),
            endDateMs: NOW.endOf('day').toMillis()
        });
        expect(result?.startDateMs).not.toBe(result?.endDateMs);
    });

    it('returns null when start is unparseable', () => {
        expect(toMillisRange('not-a-date', 'now', { now: NOW })).toBeNull();
    });

    it('returns null when end is unparseable', () => {
        expect(toMillisRange('now', 'not-a-date', { now: NOW })).toBeNull();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/svelte-super-date-picker && npx vitest run src/date-math.test.ts`

Expected: FAIL with `toMillisRange is not a function` / import error, since it doesn't exist yet.

- [ ] **Step 3: Implement `toMillisRange`**

Add to `date-math.ts`, after the existing `parse` function (after line 79):

```ts
export function toMillisRange(
    start: ShortDate,
    end: ShortDate,
    opts: { now?: DateTime } = {}
): { startDateMs: number; endDateMs: number } | null {
    const startParsed = parse(start, { now: opts.now });
    const endParsed = parse(end, { now: opts.now, roundUp: true });
    if (!startParsed || !endParsed) return null;
    return { startDateMs: startParsed.toMillis(), endDateMs: endParsed.toMillis() };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/svelte-super-date-picker && npx vitest run src/date-math.test.ts`

Expected: PASS, all tests including the 4 new `toMillisRange` cases.

- [ ] **Step 5: Commit**

```bash
git add packages/svelte-super-date-picker/src/date-math.ts packages/svelte-super-date-picker/src/date-math.test.ts
git commit -m "SuperDatePicker - Add toMillisRange conversion helper"
```

---

### Task 3: Wire `toMillisRange` into `SuperDatePicker.svelte`

**Files:**

- Modify: `packages/svelte-super-date-picker/src/SuperDatePicker.svelte`

- [ ] **Step 1: Update the import line**

Change (`SuperDatePicker.svelte:4`):

```ts
import { parse } from './date-math.js';
```

to:

```ts
import { parse, toMillisRange } from './date-math.js';
```

- [ ] **Step 2: Update `applyQuickTime`**

Change (`SuperDatePicker.svelte:81-91`):

```ts
const applyQuickTime = (range: DurationRange) => {
    start = range.start;
    end = range.end;
    showPretty = showPrettyDuration(range.start, range.end, commonlyUsedRanges);
    onTimeChange({
        start: range.start,
        end: range.end,
        isQuickSelection: true,
        isInvalid: false
    });
};
```

to:

```ts
const applyQuickTime = (range: DurationRange) => {
    start = range.start;
    end = range.end;
    showPretty = showPrettyDuration(range.start, range.end, commonlyUsedRanges);
    const millisRange = toMillisRange(range.start, range.end);
    if (!millisRange) return;
    onTimeChange({
        ...millisRange,
        isQuickSelection: true,
        isInvalid: false
    });
};
```

- [ ] **Step 3: Update `applyTime`**

Change (`SuperDatePicker.svelte:93-96`):

```ts
const applyTime = () => {
    onTimeChange({ start, end, isQuickSelection: false, isInvalid: false });
    hasChanged = false;
};
```

to:

```ts
const applyTime = () => {
    const millisRange = toMillisRange(start, end);
    if (!millisRange) return;
    onTimeChange({ ...millisRange, isQuickSelection: false, isInvalid: false });
    hasChanged = false;
};
```

- [ ] **Step 4: Update `startInterval`**

Change (`SuperDatePicker.svelte:117-122`):

```ts
const startInterval = (interval: Milliseconds) => {
    if (!onRefresh) return;
    asyncInterval = new AsyncInterval(() => {
        onRefresh({ start, end, refreshInterval: interval });
    }, interval);
};
```

to:

```ts
const startInterval = (interval: Milliseconds) => {
    if (!onRefresh) return;
    asyncInterval = new AsyncInterval(() => {
        const millisRange = toMillisRange(start, end);
        if (!millisRange) return;
        onRefresh({ ...millisRange, refreshInterval: interval });
    }, interval);
};
```

- [ ] **Step 5: Type-check the package**

Run: `cd packages/svelte-super-date-picker && npx tsc --noEmit -p tsconfig.json`

Expected: PASS (no errors).

- [ ] **Step 6: Run the package's full check script**

Run: `cd packages/svelte-super-date-picker && npm run check`

Expected: PASS (lint + prettier).

- [ ] **Step 7: Run the package's test suite**

Run: `cd packages/svelte-super-date-picker && npm run tests`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/svelte-super-date-picker/src/SuperDatePicker.svelte
git commit -m "SuperDatePicker - Emit millisecond ranges from onTimeChange/onRefresh"
```

---

### Task 4: Update `SensorsHistogram.svelte`

**Files:**

- Modify: `front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte`

- [ ] **Step 1: Simplify the script block**

Replace the whole `<script>` block (`SensorsHistogram.svelte:1-52`) with:

```svelte
<script lang="ts">
    import { getSensorsMetadata, getHistogramData, type TimeWindow } from '$lib/HomeTracker';
    import { Notice } from '$lib/components/Notice';
    import { selectedTimeWindow } from '../store';
    import TimeWindowSelection from './TimeWindowSelection.svelte';
    import { MultiSensorsGraph, type GraphType } from './MultiSensorsGraph';
    import { SuperDatePicker, type OnTimeChangeProps } from 'svelte-super-date-picker';

    const graphs: GraphType[] = [
        'temperature',
        'humidity',
        'pressure',
        'battery',
        'internalTemperature',
        'internalHumidity'
    ];

    const refreshData = async (timeWindowInput: TimeWindow) => {
        const histogramData = await getHistogramData({ timeWindow: timeWindowInput });
        const sensorsDetails = await getSensorsMetadata();
        return { histogramData, sensorsDetails };
    };

    let apiData = $state(refreshData(selectedTimeWindow.get()));

    document.addEventListener('HomeTracker-RefreshData', () => {
        apiData = refreshData(selectedTimeWindow.get());
    });

    let isPaused = $state(true);
    let refreshInterval = $state(5000);

    const handleTimeChange = (props: OnTimeChangeProps) => {
        if (props.isInvalid) return;
        apiData = refreshData({ startDateMs: props.startDateMs, endDateMs: props.endDateMs });
    };
</script>
```

Note `start`/`end` are no longer local `$state` — they become plain string literals passed directly as props to `<SuperDatePicker>` in the markup (Step 2), since they only ever seed the picker's initial value.

- [ ] **Step 2: Update the markup**

Change (`SensorsHistogram.svelte:59-65`, the `<SuperDatePicker>` usage):

```svelte
<SuperDatePicker {start} {end} {isPaused} {refreshInterval} onTimeChange={handleTimeChange} />
```

to:

```svelte
<SuperDatePicker
    start="now-15m"
    end="now"
    {isPaused}
    {refreshInterval}
    onTimeChange={handleTimeChange}
/>
```

- [ ] **Step 3: Run svelte-check**

Run: `cd front && npm run check`

Expected: PASS (no type errors).

- [ ] **Step 4: Run lint**

Run: `cd front && npm run lint`

Expected: PASS.

- [ ] **Step 5: Manual verification**

Run: `cd front && npm run dev` (or the project's existing dev-server invocation), open the Home Tracker page, and:

1. Confirm the histogram loads with the default "Last 15 minutes" range.
2. Select the "Today" quick range from `SuperDatePicker` and confirm the histogram reloads with a full-day window (not a zero-width or reversed range) — this is the exact bug being fixed.
3. Pick a custom absolute range via the date popovers and apply it, confirming the histogram reloads correctly.

Stop dev server after verifying.

- [ ] **Step 6: Commit**

```bash
git add "front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte"
git commit -m "HomeTracker - Consume millisecond output from SuperDatePicker"
```

---

### Task 5: Update the demo route

**Files:**

- Modify: `front/src/routes/(apps)/super-time-picker-demo/+page.svelte`

- [ ] **Step 1: Simplify the script block**

Replace the whole `<script>` block (`+page.svelte:1-34`) with:

```svelte
<script lang="ts">
    import { SuperDatePicker } from 'svelte-super-date-picker';
    import type { OnRefreshProps, OnTimeChangeProps } from 'svelte-super-date-picker';

    let isPaused = $state(true);
    let refreshInterval = $state(5000);
    let lastEvent = $state('');

    const handleTimeChange = (props: OnTimeChangeProps) => {
        lastEvent = `onTimeChange: ${JSON.stringify(props)}`;
        console.log('onTimeChange', props);
    };

    const handleRefresh = (props: OnRefreshProps) => {
        lastEvent = `onRefresh: ${JSON.stringify(props)}`;
        console.log('onRefresh', props);
    };

    const handleRefreshChange = (props: { isPaused: boolean; refreshInterval: number }) => {
        isPaused = props.isPaused;
        refreshInterval = props.refreshInterval;
        lastEvent = `onRefreshChange: ${JSON.stringify(props)}`;
        console.log('onRefreshChange', props);
    };
</script>
```

- [ ] **Step 2: Update the markup**

Change (`+page.svelte:47-55`):

```svelte
<SuperDatePicker
    {start}
    {end}
    {isPaused}
    {refreshInterval}
    onTimeChange={handleTimeChange}
    onRefresh={handleRefresh}
    onRefreshChange={handleRefreshChange}
/>
```

to:

```svelte
<SuperDatePicker
    start="now-15m"
    end="now"
    {isPaused}
    {refreshInterval}
    onTimeChange={handleTimeChange}
    onRefresh={handleRefresh}
    onRefreshChange={handleRefreshChange}
/>
```

- [ ] **Step 3: Run svelte-check**

Run: `cd front && npm run check`

Expected: PASS.

- [ ] **Step 4: Run lint**

Run: `cd front && npm run lint`

Expected: PASS.

- [ ] **Step 5: Manual verification**

Run: `cd front && npm run dev`, navigate to `/super-time-picker-demo`, and:

1. Select the "Today" quick range and confirm the displayed `lastEvent` JSON shows two distinct `startDateMs`/`endDateMs` values (start-of-day vs end-of-day), with no `start`/`end` string fields present.
2. Toggle "refresh" on and confirm `onRefresh` events show ms values that advance over consecutive ticks.

Stop dev server after verifying.

- [ ] **Step 6: Commit**

```bash
git add "front/src/routes/(apps)/super-time-picker-demo/+page.svelte"
git commit -m "SuperDatePicker demo - Consume millisecond output"
```

---

### Task 6: Full workspace verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full package check + tests**

Run: `cd packages/svelte-super-date-picker && npm run check && npm run tests`

Expected: PASS.

- [ ] **Step 2: Run the full front-end check + lint + prettier**

Run: `cd front && npm run check && npm run lint && npm run prettier`

Expected: PASS.

- [ ] **Step 3: Run the front-end production build**

Run: `cd front && npm run build`

Expected: PASS (build succeeds, confirming no stale imports of removed `parse` usages break the static build).
