# HomeTracker SuperDatePicker Integration

## Context

`packages/svelte-super-date-picker` (built in the prior phase, see
`2026-07-03-svelte-super-date-picker-design.md`) is now consumed by the app for the first
time via a standalone demo route only. This phase replaces the home-tracker's
`TimeWindowSelection.svelte` (a simple value+unit stepper) in
`front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte` with the new
`SuperDatePicker` component, and adds auto-refresh polling to the histogram (a new
capability - the stepper had no refresh support).

`TimeWindowSelection.svelte` and the `selectedTimeWindowSelection` / `selectedTimeWindow`
store exports in `front/src/routes/(apps)/home-tracker/store.ts` are only consumed by
`SensorsHistogram.svelte`, so they can be fully replaced/removed.

## Store Changes (`home-tracker/store.ts`)

Remove: `TimeWindowSelection` interface, `unitMs`, `toTimeWindow` (old value/unit version),
`DEFAULT_SELECTION`, `parseStoredSelection`, `selectedTimeWindowSelection`,
`selectedTimeWindow`.

Add a new persisted shape matching what `SuperDatePicker` needs:

```ts
import type { Milliseconds, ShortDate } from 'svelte-super-date-picker';

export interface DatePickerState {
    start: ShortDate;
    end: ShortDate;
    isPaused: boolean;
    refreshInterval: Milliseconds;
}

const DEFAULT_STATE: DatePickerState = {
    start: 'now-1d',
    end: 'now',
    isPaused: true,
    refreshInterval: 5000
};
```

- `parseStoredState()`: same defensive JSON parse/shape-check pattern as the old
  `parseStoredSelection`, falling back to `DEFAULT_STATE` on missing/malformed data.
  LocalStorage key: `homeTrackerDatePickerState` (new key - old
  `selectedTimeWindowSelection` key is abandoned, not migrated).
- `datePickerState` writable store, subscribed to persist to localStorage on change
  (same pattern as before).
- `toTimeWindow(start: ShortDate, end: ShortDate): TimeWindow` helper using `parse` from
  `svelte-super-date-picker` to resolve each `ShortDate` to a timestamp (`roundUp: true`
  for `end`), producing `{ startDateMs, endDateMs }`. Invalid parses fall back to `Date.now()` for that
  bound (mirrors `SuperDatePicker`'s own `isInvalid` gating - the picker's update/quick-select
  actions won't fire `onTimeChange`/`onRefresh` with unparseable values in practice).

## `SensorsHistogram.svelte` Changes

- Replace `import TimeWindowSelection from './TimeWindowSelection.svelte'` with
  `import { SuperDatePicker, parse } from 'svelte-super-date-picker'` and
  `import type { OnRefreshChangeProps, OnRefreshProps, OnTimeChangeProps } from 'svelte-super-date-picker'`.
- Replace `selectedTimeWindow`/`selectedTimeWindowSelection` import with `datePickerState`
  and `toTimeWindow` from `../store`.
- Local reactive state seeded from the store (read once, same "don't clobber in-progress
  edits" pattern `SuperDatePicker` itself uses internally):
  ```ts
  let start = $state(<from store>.start);
  let end = $state(<from store>.end);
  let isPaused = $state(<from store>.isPaused);
  let refreshInterval = $state(<from store>.refreshInterval);
  ```
- `refreshData` keeps its existing signature (`TimeWindow -> Promise<...>`); callers now
  build the `TimeWindow` via `toTimeWindow(start, end)` instead of reading it directly from
  the old store.
- Handlers:
  - `onTimeChange = (props: OnTimeChangeProps)`: if `props.isInvalid`, do nothing; else set
    `start`/`end` from `props`, persist `{ ...current stored state, start, end }` to
    `datePickerState`, and `apiData = refreshData(toTimeWindow(props.start, props.end))`.
  - `onRefresh = (props: OnRefreshProps)`: polling tick - call
    `apiData = refreshData(toTimeWindow(props.start, props.end))` without touching
    persisted `start`/`end` (matches current tick semantics: re-resolve relative dates
    against "now" each tick, don't treat it as a user range change).
  - `onRefreshChange = (props: OnRefreshChangeProps)`: update local `isPaused`/
    `refreshInterval` and persist them via `datePickerState.set({ ...current, isPaused: props.isPaused, refreshInterval: props.refreshInterval })`.
- The existing `document.addEventListener('HomeTracker-RefreshData', ...)` listener is kept,
  now recomputing via `refreshData(toTimeWindow(start, end))` using current local `start`/`end`.
- Template: replace `<TimeWindowSelection onSelect={...} />` with
  ```svelte
  <SuperDatePicker
      {start}
      {end}
      {isPaused}
      {refreshInterval}
      onTimeChange={onTimeChange}
      onRefresh={onRefresh}
      onRefreshChange={onRefreshChange}
  />
  ```
  `showUpdateButton` left at its component default (`true`).

## Deletion

`front/src/routes/(apps)/home-tracker/components/TimeWindowSelection.svelte` is deleted -
no other consumer exists.

## Testing / Verification

- `npm run check`, `npm run lint`, `npm run prettier` in `front/`.
- Manual verification via `npm run preview`/dev server on the home-tracker page: quick-select
  a range, type a custom range + click Update, toggle auto-refresh and confirm the histogram
  re-fetches on the interval, reload the page and confirm the last selection persists.

## Out of Scope

- No changes to `packages/svelte-super-date-picker` itself.
- No migration of old `selectedTimeWindowSelection` localStorage data to the new key.
