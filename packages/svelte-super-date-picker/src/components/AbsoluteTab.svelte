<script lang="ts">
    import { DateTime } from 'luxon';
    import { parse } from '../date-math.js';
    import type { ShortDate } from '../types.js';

    interface Props {
        value: ShortDate;
        roundUp?: boolean;
        onChange: (value: ShortDate) => void;
    }
    const { value, roundUp = false, onChange }: Props = $props();

    const toInputValue = (v: ShortDate) => {
        const parsed = parse(v, { roundUp });
        return parsed && parsed.isValid ? parsed.toFormat("yyyy-MM-dd'T'HH:mm:ss") : '';
    };

    // Only seeds the initial local state - the caller-provided value can be a
    // relative expression, which we resolve once here and then edit locally.
    // svelte-ignore state_referenced_locally
    let inputValue = $state(toInputValue(value));

    const handleChange = () => {
        const parsed = DateTime.fromISO(inputValue);
        if (!parsed.isValid) return;
        onChange(parsed.toISO() as string);
    };
</script>

<label class="absolute-tab">
    <span>Absolute date</span>
    <input type="datetime-local" step="1" bind:value={inputValue} onchange={handleChange} />
</label>

<style>
    .absolute-tab {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px;
    }
</style>
