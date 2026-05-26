# TimeWindowSelection Redesign

**Date:** 2026-05-27
**Scope:** `front/src/routes/(apps)/home-tracker/components/TimeWindowSelection.svelte` only

## Goal

Replace the preset dropdown with a stepper (−/number/+) plus a unit selector, letting the user enter any positive integer duration.

## Layout

```
[ − ]  [ 3 ]  [ + ]   [ day      ▼ ]
```

- Number field is directly editable (keyboard) and flanked by − and + tap buttons.
- Unit dropdown sits to the right.
- Default on load: 1 / day.

## Units

`minute`, `hour`, `day`, `month`, `year`

No auth-gating - all units available to all users. The `alltime` option is removed.

## Behavior

- Minimum value: 1. Decrement stops at 1.
- Any change (button tap, direct input, unit switch) triggers a debounced update (500ms).
- On update: compute `TimeWindow` and call both `selectedTimeWindow.set` and `onSelect`.

## Time Conversion

| Unit   | Milliseconds         |
|--------|----------------------|
| minute | 60 000               |
| hour   | 3 600 000            |
| day    | 86 400 000           |
| month  | 30 × day             |
| year   | 365 × day            |

`startDateMs = now - value * unitMs`, `endDateMs = now`

## Interface

Component props are unchanged: `onSelect: (tw: TimeWindow) => void`.

## Out of Scope

- No changes to store, types, or any file outside the component.
