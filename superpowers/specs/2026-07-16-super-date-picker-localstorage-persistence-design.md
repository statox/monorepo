# SuperDatePicker time range - localStorage persistence

## Goal

`SensorsHistogram.svelte` currently hardcodes the initial `SuperDatePicker` range
(`start="now-15m"`, `end="now"`). We want the selected range to persist across
mounts (page reloads, navigation away and back) via `localStorage`, restored on
next mount before falling back to the default. Multiple instances of this
pattern (in `SensorsHistogram` and future components) must store independent
values, keyed separately.

## Non-goals

- `SuperDatePicker.svelte` (the shared package) does not gain any localStorage
  awareness. It stays a pure controlled component driven by props/callbacks.
- No `storageKey` prop is added to `SensorsHistogram` itself. It is only
  rendered once per page today; a hardcoded internal key is sufficient
  (YAGNI). If a second instance on the same page is ever needed, add the prop
  then.

## Background: current relevant code

- `packages/svelte-super-date-picker/src/types.ts` - `OnTimeChangeProps`
  currently exposes only resolved `startDateMs`/`endDateMs` (`TimeRangeMs`),
  plus `isInvalid`/`isQuickSelection`. It does not expose the datemath
  strings (`ShortDate`, e.g. `'now-15m'`) that produced them.
- `packages/svelte-super-date-picker/src/SuperDatePicker.svelte` - tracks
  `start`/`end` (`ShortDate`) internally as `$state`, calls `onTimeChange`
  from three places (`setRange`, `applyQuickTime`, `applyTime`), each time
  spreading a `TimeRangeMs` computed via `toMillisRange`.
- `packages/svelte-super-date-picker/src/index.ts` - public exports. Does not
  currently export `toMillisRange`.
- `front/src/lib/localStore.svelte.ts` - existing generic reactive
  localStorage wrapper (`localStore(key, initialValue)` returns a `$state`-backed
  object with `.value`, JSON serialize/deserialize, `.reset()`). This is the
  established app-wide pattern for persisted state and is reused here rather
  than reinvented.
- `front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte` -
  owns `currentTimeWindow: TimeWindow` (resolved ms), computed from a
  hardcoded `defaultTimeWindow()` matching the picker's hardcoded default
  props, and updated in `handleTimeChange` from `OnTimeChangeProps`.

## Design

### 1. Expose the datemath strings from `onTimeChange`

Persisting *resolved milliseconds* would freeze relative selections (e.g.
"1 hour ago") to a fixed historical window on reload instead of re-anchoring
to the new "now". To keep relative ranges relative, we persist the datemath
strings (`DurationRange`), which requires the picker to report them.

Extend `OnTimeChangeProps` in
`packages/svelte-super-date-picker/src/types.ts`:

```ts
export interface OnTimeChangeProps extends TimeRangeMs {
    start: ShortDate;
    end: ShortDate;
    isInvalid: boolean;
    isQuickSelection: boolean;
}
```

Update the three `onTimeChange({...})` call sites in
`SuperDatePicker.svelte` (`setRange`, `applyQuickTime`, `applyTime`) to
include `start`/`end` (the values just committed) alongside the existing
`...millisRange` spread. This is additive and backward compatible - existing
consumers that destructure only `startDateMs`/`endDateMs`/etc. are unaffected.

### 2. Export `toMillisRange` from the package

`front/src/lib/components/SuperDatePicker/persistedRange.svelte.ts`.

Add to `packages/svelte-super-date-picker/src/index.ts`:

```ts
export { toMillisRange } from './date-math.js';
```

Consumers need this to resolve a persisted `DurationRange` into a `TimeWindow`
(ms) for the initial data fetch, before the picker has fired its first
`onTimeChange`.

### 3. Shared persistence helper

New file: `front/src/lib/components/SuperDatePicker/persistedRange.svelte.ts`

```ts
import { localStore } from '$lib/localStore.svelte';
import type { DurationRange } from 'svelte-super-date-picker';

export function persistedDurationRange(storageKey: string, defaultRange: DurationRange) {
    return localStore<DurationRange>(`super-date-picker:${storageKey}`, defaultRange);
}
```

A thin wrapper over the existing generic `localStore`, fixing:
- the key prefix (`super-date-picker:`) so all consumers of this pattern are
  namespaced consistently and won't collide with unrelated localStorage keys,
- the stored shape (`DurationRange` - datemath strings, not ms).

Each consumer calls this with its own unique `storageKey` to get independent,
reactive, persisted state. No new tests needed for this file beyond what
`localStore` itself already covers (it is a 3-line pass-through).

### 4. `SensorsHistogram.svelte` changes

- Remove `defaultTimeWindow()` and the ms-based `currentTimeWindow` seeding
  from a hardcoded default.
- Add:
  ```ts
  const defaultRange: DurationRange = { start: 'now-15m', end: 'now' };
  const persistedRange = persistedDurationRange(
      'home-tracker-sensors-histogram',
      defaultRange
  );
  ```
- Pass `start={persistedRange.value.start}` / `end={persistedRange.value.end}`
  to `<SuperDatePicker>` instead of the hardcoded `start="now-15m" end="now"`
  literals.
- Seed the initial `apiData` fetch via
  `toMillisRange(persistedRange.value.start, persistedRange.value.end)`
  instead of `defaultTimeWindow()`.
- In `handleTimeChange`, in addition to the existing
  `currentTimeWindow = { startDateMs: props.startDateMs, endDateMs: props.endDateMs }`,
  also update `persistedRange.value = { start: props.start, end: props.end }`
  so the newly committed selection is persisted.

## Data flow summary

```
Mount:
  persistedRange.value (from localStorage, or defaultRange)
    -> passed as start/end props to SuperDatePicker
    -> toMillisRange(...) -> seeds initial apiData fetch

User interacts with SuperDatePicker (quick select or apply):
  onTimeChange fires with { startDateMs, endDateMs, start, end, ... }
    -> currentTimeWindow updated (ms) -> apiData refetched
    -> persistedRange.value updated (datemath strings) -> auto-synced to localStorage by localStore's $effect
```

## Testing

- Package (`svelte-super-date-picker`): extend/add a vitest case asserting
  `onTimeChange` payloads include `start`/`end` matching the committed range,
  for each of the three call sites (or at minimum quick-select and manual
  apply).
- Manual verification in the browser:
  - Select a range in `SensorsHistogram`, reload the page, confirm the same
    range (and its relative/absolute nature) is restored.
  - Confirm a fresh browser profile (no localStorage entry) falls back to the
    `now-15m`/`now` default.
