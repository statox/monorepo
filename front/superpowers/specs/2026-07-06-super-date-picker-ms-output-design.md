# SuperDatePicker: expose milliseconds instead of date-math strings

## Problem

`SuperDatePicker`'s `onTimeChange`/`onRefresh` callbacks currently report `start`/`end` as `ShortDate` strings (e.g. `'now-15m'`, `'now/d'`). This leaks the package's internal date-math representation to consumers, and creates ambiguity: for a range like "Today", both `start` and `end` resolve to the literal string `'now/d'` — the only thing that differentiates them is that `end` must be parsed with `{ roundUp: true }`. Consumers (e.g. `SensorsHistogram.svelte`) have to import `parse` from the package and know this rounding rule themselves to get a correct millisecond range.

## Goal

Consumers of `SuperDatePicker` should only ever deal in raw millisecond timestamps. All `ShortDate` string handling (parsing, rounding, relative-to-now resolution) stays internal to the package.

## Non-goals

- Changing the `start`/`end` **input** props of `SuperDatePicker` (the initial/seed value). These stay `ShortDate` strings, because the component needs them to restore quick-select state (e.g. show "Last 15 minutes" as a pretty label) and because they're effectively write-once seeds already — see "Existing behavior" below.
- Changing `commonlyUsedRanges` / `recentlyUsedRanges` config props. These configure quick-select options and are inherently relative expressions (e.g. "last 15 minutes"), which can't be expressed as fixed timestamps.
- Removing the `parse`, `getDateMode`, `toAbsoluteString`, `toRelativeString`, `isRelativeToNow` exports from the package's public API. They remain available for advanced use; this change just means typical consumers no longer need them.

## Existing behavior (confirmed during investigation)

In `SuperDatePicker.svelte`, the `start`/`end` props only seed the component's internal `$state` once, on mount (marked with `svelte-ignore state_referenced_locally`). Parent updates to these props after mount do not affect the picker's own display. Both current consumers (`SensorsHistogram.svelte` and `super-time-picker-demo/+page.svelte`) assign `start = props.start` / `end = props.end` inside `onTimeChange` today, but this has no effect on the picker itself — it exists purely so the parent can subsequently call `parse()` on those strings. This confirms dropping strings from the callbacks entirely causes no behavioral regression.

## Design

### 1. Types (`packages/svelte-super-date-picker/src/types.ts`)

Add a new type for millisecond ranges, and use it in place of `DurationRange` for the two callback prop types:

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

`DurationRange` (string-based) is unchanged and continues to be used for `commonlyUsedRanges` / `recentlyUsedRanges`.

### 2. Conversion helper (`packages/svelte-super-date-picker/src/date-math.ts`)

Add a helper that centralizes the "start uses plain parse, end uses roundUp" rule (today duplicated ad hoc in `SuperDatePicker.svelte`'s `isInvalid` derivation):

```ts
export function toMillisRange(start: ShortDate, end: ShortDate): TimeRangeMs | null {
    const startParsed = parse(start);
    const endParsed = parse(end, { roundUp: true });
    if (!startParsed || !endParsed) return null;
    return { startDateMs: startParsed.toMillis(), endDateMs: endParsed.toMillis() };
}
```

Not exported from the package's public `index.ts` — it's an internal implementation detail of `SuperDatePicker.svelte`.

### 3. `SuperDatePicker.svelte` changes

Internal `start`/`end` state remains `ShortDate` strings throughout (needed for the quick-select popover, pretty-duration label, and relative/absolute tabs). Only the two emission points change, converting via `toMillisRange` and spreading the result instead of the raw strings:

- `applyQuickTime` (quick-select apply) — ranges are valid by construction, non-null assert.
- `applyTime` (the "Update" button apply path) — already gated by `isInvalid` in the UI, non-null assert.
- The `startInterval` tick callback (`onRefresh`) — recomputed fresh on every tick, since relative strings like `now-15m` must resolve against the current time on each refresh, not the time of the last apply.

### 4. Consumer updates

**`front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte`**: `handleTimeChange` no longer calls `parse()`; it consumes `props.startDateMs` / `props.endDateMs` directly. The `start`/`end` local `$state` variables and the `parse` import are removed — they were only ever used for the old string-to-ms conversion. The `start`/`end` constants passed into `<SuperDatePicker>` as seed props remain plain string literals (`'now-15m'`, `'now'`).

**`front/src/routes/(apps)/super-time-picker-demo/+page.svelte`**: same simplification — `handleTimeChange`/`handleRefresh` drop their `parse()` calls and display `startDateMs`/`endDateMs` directly.

## Testing

- Existing unit tests in `packages/svelte-super-date-picker/src/date-math.test.ts` gain coverage for the new `toMillisRange` helper (valid range, invalid start/end, and the "Today" case where `start === end` as strings but resolve to different ms boundaries).
- Manual verification via the `super-time-picker-demo` route: exercise quick-select, absolute range, relative range, and refresh-while-paused-off, confirming `startDateMs`/`endDateMs` are correct and distinct in the "Today" case.
- `SensorsHistogram.svelte` manually verified against the real HomeTracker backend for at least one quick-select range and one custom absolute range.
