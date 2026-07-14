# SuperDatePicker Now-Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-interactive "Now" tab to the end-date `DatePopoverButton` that immediately sets the value to `'now'` and closes the popover when clicked.

**Architecture:** `DatePopoverButton.svelte` gets a `showNowTab` prop and a third tab button with no sub-panel — clicking it calls `onChange('now')` directly instead of switching to a configurable view. `SuperDatePicker.svelte` passes `showNowTab={true}` only on the end-date instance.

**Tech Stack:** SvelteKit 5 (runes), TypeScript.

**Spec:** `front/superpowers/specs/2026-07-06-super-date-picker-now-tab-design.md`

---

### Task 1: Add the "Now" tab to `DatePopoverButton.svelte`

**Files:**

- Modify: `packages/svelte-super-date-picker/src/components/DatePopoverButton.svelte`

- [ ] **Step 1: Add the `showNowTab` prop**

Change the `Props` interface and destructure (`DatePopoverButton.svelte:8-16`):

```ts
interface Props {
    value: ShortDate;
    roundUp?: boolean;
    dateFormat: string;
    isInvalid: boolean;
    isDisabled: boolean;
    showNowTab?: boolean;
    onChange: (value: ShortDate) => void;
}
const {
    value,
    roundUp = false,
    dateFormat,
    isInvalid,
    isDisabled,
    showNowTab = false,
    onChange
}: Props = $props();
```

- [ ] **Step 2: Widen `activeTab` and seed it from `getDateMode`**

Change (`DatePopoverButton.svelte:18-24`):

```ts
let isOpen = $state(false);
// Only seeds the initial local state - the active tab shouldn't jump
// around as the caller-provided value changes while the popover is open.
// svelte-ignore state_referenced_locally
let activeTab = $state<'absolute' | 'relative'>(
    getDateMode(value) === 'absolute' ? 'absolute' : 'relative'
);
```

to:

```ts
let isOpen = $state(false);
// Only seeds the initial local state - the active tab shouldn't jump
// around as the caller-provided value changes while the popover is open.
// svelte-ignore state_referenced_locally
let activeTab = $state<'absolute' | 'relative' | 'now'>(
    getDateMode(value) === 'now'
        ? 'now'
        : getDateMode(value) === 'absolute'
          ? 'absolute'
          : 'relative'
);
```

- [ ] **Step 3: Add the `selectNow` handler**

Add after `handleChange` (`DatePopoverButton.svelte:41-43`):

```ts
const handleChange = (nextValue: ShortDate) => {
    onChange(nextValue);
};

const selectNow = () => {
    handleChange('now');
    closePopover();
};
```

- [ ] **Step 4: Render the third tab button**

Change the tabs row (`DatePopoverButton.svelte:67-82`):

```svelte
<div class="date-popover-button__tabs">
    <button
        type="button"
        class:active={activeTab === 'absolute'}
        onclick={() => (activeTab = 'absolute')}
    >
        Absolute
    </button>
    <button
        type="button"
        class:active={activeTab === 'relative'}
        onclick={() => (activeTab = 'relative')}
    >
        Relative
    </button>
    {#if showNowTab}
        <button type="button" class:active={activeTab === 'now'} onclick={selectNow}> Now </button>
    {/if}
</div>
```

- [ ] **Step 5: Drop the panel-body fallback for the `'now'` tab**

Change (`DatePopoverButton.svelte:83-87`):

```svelte
{#if activeTab === 'absolute'}
    <AbsoluteTab {value} {roundUp} onChange={handleChange} />
{:else}
    <RelativeTab {value} {roundUp} {dateFormat} onChange={handleChange} />
{/if}
```

to:

```svelte
{#if activeTab === 'absolute'}
    <AbsoluteTab {value} {roundUp} onChange={handleChange} />
{:else if activeTab === 'relative'}
    <RelativeTab {value} {roundUp} {dateFormat} onChange={handleChange} />
{/if}
```

- [ ] **Step 6: Type-check the package**

Run: `cd packages/svelte-super-date-picker && npx svelte-check --tsconfig ./tsconfig.json`

Expected: `COMPLETED ... 0 ERRORS 0 WARNINGS`

- [ ] **Step 7: Run the package's lint and prettier checks**

Run: `cd packages/svelte-super-date-picker && npm run check`

Expected: PASS (lint + prettier), no output errors.

- [ ] **Step 8: Run the package's test suite**

Run: `cd packages/svelte-super-date-picker && npm run tests`

Expected: PASS, all existing tests still green (no test file targets `DatePopoverButton.svelte` directly, so this just guards against accidental regressions elsewhere).

- [ ] **Step 9: Commit**

```bash
git add packages/svelte-super-date-picker/src/components/DatePopoverButton.svelte
git commit -m "SuperDatePicker - Add optional non-interactive Now tab to DatePopoverButton"
```

---

### Task 2: Enable the "Now" tab on the end-date popover only

**Files:**

- Modify: `packages/svelte-super-date-picker/src/SuperDatePicker.svelte`

- [ ] **Step 1: Pass `showNowTab` to the end-date `DatePopoverButton`**

Change (`SuperDatePicker.svelte:169-184`):

```svelte
<DatePopoverButton
    value={start}
    {dateFormat}
    {isInvalid}
    {isDisabled}
    onChange={(value) => setRange({ start: value, end })}
/>
<span class="super-date-picker__delimiter">→</span>
<DatePopoverButton
    value={end}
    roundUp
    {dateFormat}
    {isInvalid}
    {isDisabled}
    onChange={(value) => setRange({ start, end: value })}
/>
```

to:

```svelte
<DatePopoverButton
    value={start}
    {dateFormat}
    {isInvalid}
    {isDisabled}
    onChange={(value) => setRange({ start: value, end })}
/>
<span class="super-date-picker__delimiter">→</span>
<DatePopoverButton
    value={end}
    roundUp
    showNowTab
    {dateFormat}
    {isInvalid}
    {isDisabled}
    onChange={(value) => setRange({ start, end: value })}
/>
```

- [ ] **Step 2: Type-check the package**

Run: `cd packages/svelte-super-date-picker && npx svelte-check --tsconfig ./tsconfig.json`

Expected: `COMPLETED ... 0 ERRORS 0 WARNINGS`

- [ ] **Step 3: Run the package's lint, prettier, and test suite**

Run: `cd packages/svelte-super-date-picker && npm run check && npm run tests`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/svelte-super-date-picker/src/SuperDatePicker.svelte
git commit -m "SuperDatePicker - Show Now tab only on the end-date popover"
```

---

### Task 3: Front-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the front-end's full check + lint + prettier**

Run: `cd front && npm run check && npm run lint && npm run prettier`

Expected: PASS.

- [ ] **Step 2: Manual verification (user-driven)**

Start the dev server (`cd front && npm run dev`) and, in a browser, on either `/super-time-picker-demo` or the Home Tracker page:

1. Open the **end**-date popover and confirm a third "Now" tab is visible alongside Absolute/Relative.
2. Click "Now" and confirm the end date immediately becomes "now" and the popover closes.
3. Reopen the end-date popover and confirm the "Now" tab shows as active/highlighted.
4. Open the **start**-date popover and confirm there is no "Now" tab (only Absolute/Relative).

Stop the dev server after verifying.
