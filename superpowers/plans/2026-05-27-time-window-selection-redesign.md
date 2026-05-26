# TimeWindowSelection Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the preset time window dropdown with a stepper (−/number/+) and a unit selector that lets the user enter any positive integer duration.

**Architecture:** Single component rewrite — `TimeWindowSelection.svelte` is the only file touched. Internally it holds two state variables (`selectedValue: number`, `selectedUnit: string`), debounces changes with a `setTimeout`/`clearTimeout` pattern, and converts to `TimeWindow` using the same `startDateMs = now - value * unitMs` formula. The component's external interface (`onSelect` prop, `selectedTimeWindow` store) is unchanged.

**Tech Stack:** Svelte 5 (runes), TypeScript, no component test framework present — validation via `svelte-check` and ESLint.

---

### Task 1: Rewrite TimeWindowSelection.svelte

**Files:**
- Modify: `front/src/routes/(apps)/home-tracker/components/TimeWindowSelection.svelte`

- [ ] **Step 1: Replace the component with the new implementation**

Overwrite the file with:

```svelte
<script lang="ts">
    import type { TimeWindow } from '$lib/HomeTracker';
    import { selectedTimeWindow } from '../store';

    interface Props {
        onSelect: (newTimeWindow: TimeWindow) => void;
    }
    const { onSelect }: Props = $props();

    const MINUTE = 60_000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    const unitMs: Record<string, number> = {
        minute: MINUTE,
        hour: HOUR,
        day: DAY,
        month: 30 * DAY,
        year: 365 * DAY
    };

    const units = [
        { label: 'minute', value: 'minute' },
        { label: 'hour', value: 'hour' },
        { label: 'day', value: 'day' },
        { label: 'month', value: 'month' },
        { label: 'year', value: 'year' }
    ];

    let selectedValue = $state(1);
    let selectedUnit = $state('day');
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const toTimeWindow = (): TimeWindow => {
        const now = Date.now();
        return { startDateMs: now - selectedValue * unitMs[selectedUnit], endDateMs: now };
    };

    const notify = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const tw = toTimeWindow();
            selectedTimeWindow.set(tw);
            onSelect(tw);
        }, 500);
    };

    const decrement = () => {
        if (selectedValue > 1) {
            selectedValue -= 1;
            notify();
        }
    };

    const increment = () => {
        selectedValue += 1;
        notify();
    };

    const handleValueInput = () => {
        if (selectedValue < 1) selectedValue = 1;
        notify();
    };
</script>

<div class="time-window-select">
    <label for="time-window-value" class="far fa-calendar-alt"></label>
    <div class="stepper">
        <button type="button" onclick={decrement} aria-label="Decrease">−</button>
        <input
            id="time-window-value"
            type="number"
            min="1"
            bind:value={selectedValue}
            oninput={handleValueInput}
        />
        <button type="button" onclick={increment} aria-label="Increase">+</button>
    </div>
    <select bind:value={selectedUnit} onchange={notify}>
        {#each units as unit}
            <option value={unit.value}>{unit.label}</option>
        {/each}
    </select>
</div>

<style>
    .time-window-select {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 5px;
    }

    .stepper {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .stepper button {
        width: 2rem;
        height: 2rem;
        font-size: 1.2rem;
        line-height: 1;
        cursor: pointer;
        touch-action: manipulation;
    }

    .stepper input {
        width: 3.5rem;
        text-align: center;
    }
</style>
```

- [ ] **Step 2: Run svelte-check**

```bash
cd front && npm run check
```

Expected: no errors. Fix any type errors before continuing.

- [ ] **Step 3: Run lint**

```bash
cd front && npm run lint
```

Expected: no errors. Fix any ESLint issues before continuing.

- [ ] **Step 4: Run prettier check**

```bash
cd front && npm run prettier
```

If formatting issues reported, run:

```bash
cd front && npm run prettier:fix
```

- [ ] **Step 5: Wait for user validation**

Let them test and give you feedbacks if needed
