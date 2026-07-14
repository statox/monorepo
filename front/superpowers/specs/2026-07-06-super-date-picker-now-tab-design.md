# SuperDatePicker: "Now" tab for the end-date popover

## Problem

Setting the end of a range to "right now" currently requires switching to the Relative tab and entering a 0-offset relative expression, or knowing to type `now` in some other way. There's no one-click way to say "end date is now."

## Goal

Add a third tab, "Now", to the end-date `DatePopoverButton` only. Clicking it immediately sets the value to `'now'` and closes the popover — there's nothing to configure, so unlike Absolute/Relative it has no sub-panel.

## Design

### `DatePopoverButton.svelte`

- New prop `showNowTab?: boolean` (default `false`).
- `activeTab` state type widens from `'absolute' | 'relative'` to `'absolute' | 'relative' | 'now'`, still seeded once from `getDateMode(value)` on mount (existing `svelte-ignore state_referenced_locally` pattern), so reopening the popover on a value of `'now'` shows the "Now" tab highlighted.
- The tab row renders the "Now" button only when `showNowTab` is true:

```svelte
{#if showNowTab}
    <button type="button" class:active={activeTab === 'now'} onclick={selectNow}> Now </button>
{/if}
```

- `selectNow` applies immediately instead of just switching tabs:

```ts
const selectNow = () => {
    handleChange('now');
    closePopover();
};
```

- The panel body conditional drops the `{:else}` fallback so nothing renders when `activeTab === 'now'` (there is no `NowTab.svelte` — no sub-panel needed):

```svelte
{#if activeTab === 'absolute'}
    <AbsoluteTab {value} {roundUp} onChange={handleChange} />
{:else if activeTab === 'relative'}
    <RelativeTab {value} {roundUp} {dateFormat} onChange={handleChange} />
{/if}
```

### `SuperDatePicker.svelte`

Only the end-date `DatePopoverButton` instance (the one passed `roundUp`) gets `showNowTab={true}`. The start-date instance is unchanged (no `showNowTab` prop, defaults to `false`).

## Non-goals

- No "Now" tab on the start-date popover.
- No new exported types — `showNowTab` is a plain `boolean` prop, no new public type needed in `types.ts`.

## Testing

- Manual verification via the `super-time-picker-demo` route and `SensorsHistogram.svelte`: open the end-date popover, confirm the "Now" tab appears and clicking it sets the end date to "now" and closes the popover. Confirm the start-date popover has no "Now" tab.
- Manual verification that reopening the end popover after selecting "Now" shows the "Now" tab as active/highlighted.
