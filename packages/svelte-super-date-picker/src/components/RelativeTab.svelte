<script lang="ts">
    import { parse, parseRelativeParts, toRelativeStringFromParts } from '../date-math.js';
    import { relativeOptions, relativeRoundingLabels } from '../time-options.js';
    import type { ShortDate, TimeUnitId } from '../types.js';

    interface Props {
        value: ShortDate;
        roundUp?: boolean;
        dateFormat: string;
        onChange: (value: ShortDate) => void;
    }
    const { value, roundUp = false, dateFormat, onChange }: Props = $props();

    // Only seeds the initial local state - value changing afterwards should
    // not reset the user's in-progress edit.
    // svelte-ignore state_referenced_locally
    const initial = parseRelativeParts(value);
    let count = $state<number | undefined>(initial.count);
    let unit = $state(initial.unit);
    let round = $state(initial.round);
    const roundUnit = initial.roundUnit;

    const emit = () => {
        if (count === undefined || count < 0) return;
        onChange(toRelativeStringFromParts({ count, unit, round, roundUnit }));
    };

    const onCountInput = (event: Event) => {
        const raw = parseInt((event.target as HTMLInputElement).value, 10);
        count = isNaN(raw) ? undefined : raw;
        emit();
    };

    let formattedValue = $derived.by(() => {
        const parsed = parse(value, { roundUp });
        return parsed && parsed.isValid ? parsed.toFormat(dateFormat) : '';
    });
</script>

<div class="relative-tab">
    <div class="relative-tab__row">
        <input
            type="number"
            min="0"
            value={count}
            oninput={onCountInput}
            aria-label="Time span amount"
        />
        <select bind:value={unit} onchange={emit} aria-label="Relative time span">
            {#each relativeOptions as option (option.value)}
                <option value={option.value}>{option.text}</option>
            {/each}
        </select>
    </div>
    <input type="text" value={formattedValue} readonly aria-label="Resolved date" />
    <label class="relative-tab__round">
        <input type="checkbox" bind:checked={round} onchange={emit} />
        {relativeRoundingLabels[unit.replace('+', '') as TimeUnitId]}
    </label>
</div>

<style>
    .relative-tab {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px;
    }

    .relative-tab__row {
        display: flex;
        gap: 6px;
    }

    .relative-tab__row input[type='number'] {
        width: 4rem;
    }

    .relative-tab__round {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
    }
</style>
