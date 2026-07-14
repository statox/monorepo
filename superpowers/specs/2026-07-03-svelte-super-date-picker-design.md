# Svelte Super Date Picker Package Design

**Date:** 2026-07-03
**Status:** Approved

## Problem

Kibana's `EuiSuperDatePicker` (from `@elastic/eui`) is a well-designed time-range control: quick-select popover with commonly-used/recently-used ranges, absolute + relative date pickers per side, refresh-interval control with auto-refresh, and an "needs update" button. `front`'s `home-tracker` page currently uses two much simpler, separate controls (`TimeControls.svelte` for manual/auto refresh, `TimeWindowSelection.svelte` for a relative duration stepper) with no absolute date selection and no recently-used memory.

EUI's implementation is React + Emotion (CSS-in-JS) + moment.js + `@elastic/datemath`, none of which fit `front` (SvelteKit 5, scoped `<style>` blocks, Luxon). It can't be depended on directly; it needs a from-scratch Svelte port, using the EUI source (cloned locally at `/home/adrien/dev/monorepo/eui`, not committed) as a behavioral/UX reference only.

## Goal

Create a new source-only package, `packages/svelte-super-date-picker`, implementing a Svelte 5 port of `EuiSuperDatePicker` with full feature parity, styled to match `front`'s existing design system, using Luxon for date handling. Prove it out via a standalone demo route in `front`. Do not touch the home-tracker page's existing time-control components or wiring in this phase.

## Scope

**In scope:**
- Full-parity port of `EuiSuperDatePicker`'s behavior:
  - Quick-select popover: "Last N units" relative range picker, commonly-used ranges list, recently-used ranges list.
  - Per-side (start/end) date popover with Absolute / Relative / Now tabs.
  - Relative time-string parsing/formatting (`now-15m`, `now/d`, etc.), ported from `@elastic/datemath` + `relative_utils.ts` onto Luxon `DateTime`.
  - Refresh interval control with auto-refresh ticking (ported from `async_interval.ts`).
  - Update button with "needs update" state, matching EUI's `showUpdateButton` behavior.
- Vitest unit tests for the date-math module (parsing, formatting, rounding) and any other pure logic.
- A demo route in `front` that mounts the component standalone to prove it renders/behaves correctly in the real app.

**Out of scope (follow-up work):**
- Any change to `front/src/routes/(apps)/home-tracker/components/TimeControls.svelte`, `TimeWindowSelection.svelte`, the `selectedTimeWindowSelection`/`selectedTimeWindow` store, or the `HomeTracker-RefreshData` event bus.
- Publishing the package outside this monorepo.
- Visual fidelity to Kibana/EUI's exact look (colors, spacing, shadows) - it should look native to `front` instead.
- i18n (EUI's `EuiI18nConsumer` wrapping is dropped; strings are hardcoded English, consistent with the rest of `front`).

## Package Structure

Mirrors the `packages/sdk` pattern (see `superpowers/specs/2026-05-20-sdk-package-design.md`): unbuilt, source-exported, consumed via a `file:` dependency.

```
packages/svelte-super-date-picker/
├── src/
│   ├── SuperDatePicker.svelte       # Top-level component
│   ├── components/
│   │   ├── QuickSelectPopover.svelte
│   │   ├── CommonlyUsedRanges.svelte
│   │   ├── RecentlyUsedRanges.svelte
│   │   ├── DatePopover.svelte       # Wraps Absolute/Relative/Now tabs for one side (start or end)
│   │   ├── AbsoluteTab.svelte
│   │   ├── RelativeTab.svelte
│   │   ├── RefreshInterval.svelte
│   │   └── UpdateButton.svelte
│   ├── date-math.ts                 # Luxon port of datemath + relative_utils parsing/formatting
│   ├── types.ts                     # ShortDate, DurationRange, OnTimeChangeProps, OnRefreshProps, etc.
│   └── index.ts                     # export { default as SuperDatePicker } from './SuperDatePicker.svelte'; export * from './types'; export * from './date-math'
├── tests/
│   └── date-math.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.mjs
├── .prettierrc
└── README.md
```

## Public API

Props on `<SuperDatePicker>` mirror `EuiSuperDatePickerProps`, trimmed of React/EUI-specific concerns (no `customQuickSelectRender`, no `locale`/moment `LocaleSpecifier`, no `utcOffset`, no i18n render-prop plumbing):

```ts
interface SuperDatePickerProps {
  start?: ShortDate;               // default 'now-15m'
  end?: ShortDate;                 // default 'now'
  onTimeChange: (props: OnTimeChangeProps) => void;
  onRefresh?: (props: OnRefreshProps) => void;
  onRefreshChange?: (props: { refreshInterval: number; isPaused: boolean }) => void;
  isPaused?: boolean;               // default true
  refreshInterval?: number;         // ms, default 1000
  commonlyUsedRanges?: DurationRange[];
  recentlyUsedRanges?: DurationRange[];
  showUpdateButton?: boolean | 'iconOnly'; // default true
  dateFormat?: string;
  compressed?: boolean;
  isDisabled?: boolean;
}
```

`ShortDate` stays a string (`'now-15m'` or an absolute ISO string), same as EUI - resolving it to actual timestamps is the consumer's job via the exported `parse()` function from `date-math.ts`, since relative strings must be re-evaluated against "now" on every refresh tick.

## Date Math Module

`date-math.ts` replaces `@elastic/datemath` + `relative_utils.ts`, operating on Luxon `DateTime` instead of `moment.Moment`:

- `parse(value: ShortDate, opts?: { roundUp?: boolean }): DateTime | null` - equivalent of `dateMath.parse()`.
- `parseRelativeParts(value: string): RelativeParts` - same regex-based parsing (`now([+-]\d+)([smhdwMy])(/[smhdwMy])?`), Luxon `Duration`/`DateTime.diff` instead of `moment.duration`.
- `toRelativeStringFromParts(parts: RelativeParts): string` - unchanged logic, string formatting only.
- `isRelativeToNow(start, end): boolean` - unchanged logic, ported to use the new `DATE_MODES` helper.

These are pure functions, fully unit-testable in isolation from Svelte - covered by `tests/date-math.test.ts` via Vitest (parsing `now-15m`, `now/d`, absolute ISO strings, round-up end-of-range semantics, invalid input).

## State & Styling

- Svelte 5 runes (`$state`, `$derived`) internally. Public interface is props + callbacks (`onTimeChange`, `onRefresh`, `onRefreshChange`), not stores - keeps the component a self-contained, framework-idiomatic unit that doesn't dictate a store shape to consumers.
- Styling: scoped `<style>` blocks per `.svelte` file, using `front`'s CSS custom properties from `new_theme.css` (light/dark) - not a pixel clone of EUI/Kibana's visual design.

## Demo Route

`front/src/routes/(noso)/svelte-super-date-picker-demo/+page.svelte` (following the existing `(noso)/noso` demo-route pattern) mounts `<SuperDatePicker>` with stub callbacks (`console.log`) to verify rendering and interaction end-to-end in the real app. No route metadata/header wiring beyond what SvelteKit requires to render.

## Frontend Wiring

`front/package.json` adds:
```json
"svelte-super-date-picker": "file:../packages/svelte-super-date-picker"
```

No Vite config changes needed - same resolution mechanism as `statox-api`.

## Testing

- `packages/svelte-super-date-picker`: Vitest for `date-math.ts` pure-function tests. `npm run tests` script, mirroring `packages/sdk`'s `npm run tests` convention.
- No component/UI tests in this phase (no precedent in `front`); the demo route is the verification mechanism for rendering/interaction, per `superpowers:verify`.
- `npm run check` / `npm run lint` / `npm run prettier` scripts mirrored from `packages/sdk`.

## What Gets Deleted

Nothing. `TimeControls.svelte`, `TimeWindowSelection.svelte`, and the home-tracker store/event-bus are untouched in this phase.

## README Requirements

`packages/svelte-super-date-picker/README.md` must document:
1. What this is and why it exists (Svelte port of `EuiSuperDatePicker`, EUI source used as reference only, not a dependency).
2. Source-only package, no build step - same rationale as `packages/sdk`.
3. How to consume (`file:` dependency, `import { SuperDatePicker } from 'svelte-super-date-picker'`).
4. `ShortDate` semantics and that consumers must re-resolve relative strings via `parse()` on each refresh tick.
5. Running tests (`npm run tests`).
