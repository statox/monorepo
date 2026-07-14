<script lang="ts">
    import { DateTime } from 'luxon';
    import QuickSelectPanel from './QuickSelectPanel.svelte';
    import { parse } from '../date-math.js';
    import { parseTimeParts } from '../quick-select-utils.js';
    import { timeTenseOptions, timeUnitsOptions } from '../time-options.js';
    import type { DurationRange, TimeUnitId } from '../types.js';

    interface Props {
        start: string;
        end: string;
        onApply: (range: DurationRange) => void;
    }
    const { start, end, onApply }: Props = $props();

    // Only seeds the initial local state, like EUI's constructor - start/end
    // changing afterwards should not reset the user's in-progress selection.
    // svelte-ignore state_referenced_locally
    const initial = parseTimeParts(start, end);
    let timeTense = $state<'last' | 'next'>(initial.timeTense);
    let timeValue = $state(initial.timeValue);
    let timeUnits = $state<TimeUnitId>(initial.timeUnits);

    const applyQuickSelect = () => {
        if (timeTense === 'next') {
            onApply({ start: 'now', end: `now+${timeValue}${timeUnits}` });
            return;
        }
        onApply({ start: `now-${timeValue}${timeUnits}`, end: 'now' });
    };

    const getBounds = () => {
        const min = parse(start) ?? DateTime.now().minus({ minutes: 15 });
        const max = parse(end, { roundUp: true }) ?? DateTime.now();
        return { min, max };
    };

    const stepBackward = () => {
        const { min, max } = getBounds();
        const diffMs = max.diff(min).as('milliseconds');
        onApply({
            start: min.minus({ milliseconds: diffMs }).toISO() as string,
            end: min.toISO() as string
        });
    };

    const stepForward = () => {
        const { min, max } = getBounds();
        const diffMs = max.diff(min).as('milliseconds');
        onApply({
            start: max.toISO() as string,
            end: max.plus({ milliseconds: diffMs }).toISO() as string
        });
    };

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') applyQuickSelect();
    };
</script>

<QuickSelectPanel title="Quick select">
    <div class="quick-select__steppers">
        <button type="button" aria-label="Previous time window" onclick={stepBackward}>‹</button>
        <button type="button" aria-label="Next time window" onclick={stepForward}>›</button>
    </div>
    <div class="quick-select__row">
        <select bind:value={timeTense} onkeydown={handleKeydown} aria-label="Time tense">
            {#each timeTenseOptions as option (option.value)}
                <option value={option.value}>{option.text}</option>
            {/each}
        </select>
        <input
            type="number"
            min="1"
            bind:value={timeValue}
            onkeydown={handleKeydown}
            aria-label="Time value"
        />
        <select bind:value={timeUnits} onkeydown={handleKeydown} aria-label="Time unit">
            {#each timeUnitsOptions as option (option.value)}
                <option value={option.value}>{option.text}</option>
            {/each}
        </select>
        <button type="button" disabled={timeValue <= 0} onclick={applyQuickSelect}>Apply</button>
    </div>
</QuickSelectPanel>

<style>
    .quick-select__steppers {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        margin-bottom: 4px;
    }

    .quick-select__row {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .quick-select__row input[type='number'] {
        width: 4rem;
    }
</style>
