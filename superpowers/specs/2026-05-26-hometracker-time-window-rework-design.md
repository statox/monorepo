# HomeTracker - Time Window Rework Design

**Date:** 2026-05-26

## Context

The HomeTracker histogram endpoint previously accepted a fixed string enum for the time window (`'30m'`, `'3h'`, `'1d'`, etc.). This was originally required for caching on a public endpoint. That endpoint no longer exists, so caching is gone and the fixed list can be replaced with a flexible `{ startDateMs, endDateMs }` pair.

## Approach

Backend-first, then frontend. Each layer is independently verifiable before moving to the next.

---

## Section 1: Types & Data Contracts

### New `TimeWindow` type

Added to `back/src/libs/modules/homeTracker/types.ts`:

```typescript
export interface TimeWindow {
    startDateMs: number; // Unix ms
    endDateMs: number;   // Unix ms
}
```

### Backend route input schema

Replaces the `enum` string in `back/src/libs/routes/homeTracker/histogramData.ts`:

```json
{
  "timeWindow": {
    "type": "object",
    "required": ["startDateMs", "endDateMs"],
    "additionalProperties": false,
    "properties": {
      "startDateMs": { "type": "number" },
      "endDateMs":   { "type": "number" }
    }
  }
}
```

### Logging fields

Added to `LoggableProperties` in `back/src/libs/modules/logging/types.ts`:

```typescript
timewindowStartMs?: number;
timewindowEndMs?: number;
```

The existing `timewindow?: string` field is kept (may be used elsewhere) but the histogram route switches to the two new numeric fields.

### Frontend `TimeWindow` type

In `front/src/lib/HomeTracker/types.ts`:
- Remove `TimeWindowPublic` (was `'30m' | '3h' | '12h' | '1d' | '3d' | '7d' | '2w'`)
- Remove old string `TimeWindow` (was `TimeWindowPublic | '6M' | 'alltime'`)
- Add the same interface as the backend:

```typescript
export interface TimeWindow {
    startDateMs: number;
    endDateMs: number;
}
```

---

## Section 2: Backend Service Layer

**File:** `back/src/libs/modules/homeTracker/services/getHistogramData.ts`

### `computeNbBuckets` (new helper, same file)

Replaces the hardcoded per-window bucket counts. Targets a granularity appropriate for the duration, staying within 50-360 visible data points. ELK's `auto_date_histogram` rounds up to the nearest "nice" interval, so these are effective ceilings.

```typescript
const computeNbBuckets = (startDateMs: number, endDateMs: number): number => {
    const durationMs = endDateMs - startDateMs;
    const MINUTE = 60_000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    let targetIntervalMs: number;
    if      (durationMs <= 2 * HOUR)  targetIntervalMs = 2 * MINUTE;   // ≤60 buckets
    else if (durationMs <= DAY)        targetIntervalMs = 15 * MINUTE;  // ≤96 buckets
    else if (durationMs <= 14 * DAY)   targetIntervalMs = HOUR;         // ≤336 buckets
    else if (durationMs <= 90 * DAY)   targetIntervalMs = 6 * HOUR;     // ≤360 buckets
    else                               targetIntervalMs = DAY;           // 1/day

    return Math.ceil(durationMs / targetIntervalMs);
};
```

### `getHistogramData` signature

```typescript
export const getHistogramData = async (timeWindow: TimeWindow) => { ... }
```

### ELK query changes

- `gte: timeWindow.startDateMs` (replaces computed `earliestTS`)
- Add `lte: timeWindow.endDateMs` to the range filter
- `buckets: computeNbBuckets(timeWindow.startDateMs, timeWindow.endDateMs)`
- Add `minimum_interval: 'minute'` to `auto_date_histogram` (explicit floor, prevents sub-minute intervals)

### New AppError

`INVALID_TIME_WINDOW` - thrown when `startDateMs >= endDateMs`. Declared in `clientErrors` on the route so the client receives a clean 4xx rather than a 500.

---

## Section 3: Backend Route & Tests

**File:** `back/src/libs/routes/homeTracker/histogramData.ts`

### Route handler logging

```typescript
params.loggableContext.addData('timewindowStartMs', params.input.timeWindow.startDateMs);
params.loggableContext.addData('timewindowEndMs', params.input.timeWindow.endDateMs);
```

### Tests (`back/tests/routes/homeTracker/histogramData/histogramData.test.ts`)

Update existing tests to send `{ startDateMs, endDateMs }` instead of a string.

New tests to add:
1. `startDateMs >= endDateMs` → returns `INVALID_TIME_WINDOW` error (400)
2. Data outside the time window (before `startDateMs` or after `endDateMs`) is excluded from results
3. Update "should create buckets based on the time" to also verify the latest bucket respects `endDateMs`

---

## Section 4: Frontend

### `store.ts` (`front/src/routes/(apps)/home-tracker/store.ts`)

Store type changes from `TimeWindow` (string) to `TimeWindow` (object). LocalStorage migration: if the stored value parses as a string, discard it and use the default.

Default value (computed once at store init, not reactively updated):
```typescript
const DEFAULT: TimeWindow = {
    startDateMs: Date.now() - 24 * 60 * 60 * 1000,
    endDateMs: Date.now()
};
```

### `TimeWindowSelection.svelte`

Keeps the existing dropdown options list unchanged. On selection, converts the chosen string to a `TimeWindow`:
- For named durations: `{ startDateMs: Date.now() - offset, endDateMs: Date.now() }`
- For `alltime`: `startDateMs` = Aug 30 2024 00:00:00 UTC (matching current backend hardcoded start). This date moves from the backend service to the frontend - the backend no longer needs to know about it since it now accepts arbitrary timestamps.

Emits the computed `TimeWindow` object via `onSelect` and updates the store.

### `SensorsHistogram.svelte`

`refreshData` parameter type changes from old string `TimeWindow` to new object `TimeWindow`. No other functional changes - `getHistogramData` is called with the store value which is now the correct shape.

### `SensorsSummary.svelte`

`refreshData` accepts `timeWindowInput` but never passes it to any API call (only calls `getSensorsMetadata()`). Parameter type updated to new `TimeWindow` interface for consistency with the store, but no functional change.

### `api.ts`

No changes. Thin wrapper around the auto-generated SDK client, which updates automatically after `npm run generate:sdk`.

---

## Out of Scope

- UI rework of `TimeWindowSelection` (custom date pickers etc.) - planned for a future session
- Any changes to `getSensorsMetadata` or `SensorsSummary` data fetching logic
