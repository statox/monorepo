<script lang="ts">
    import type { TimeWindow } from '$lib/HomeTracker';
    import { selectedTimeWindowSelection, toTimeWindow } from '../store';

    interface Props {
        onSelect: (newTimeWindow: TimeWindow) => void;
    }
    const { onSelect }: Props = $props();

    const units = [
        { label: 'minute', value: 'minute' },
        { label: 'hour', value: 'hour' },
        { label: 'day', value: 'day' },
        { label: 'month', value: 'month' },
        { label: 'year', value: 'year' }
    ];

    let selectedValue = $state($selectedTimeWindowSelection.value);
    let selectedUnit = $state($selectedTimeWindowSelection.unit);
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const notify = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const selection = { value: selectedValue, unit: selectedUnit };
            selectedTimeWindowSelection.set(selection);
            onSelect(toTimeWindow(selection));
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
        appearance: textfield; /* Remove the built-in up/down arrows on firefox */
    }

    .stepper input::-webkit-inner-spin-button,
    .stepper input::-webkit-outer-spin-button {
        appearance: none;
        margin: 0;
    }
</style>
