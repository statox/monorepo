<script lang="ts">
    import { user } from '$lib/auth';
    import type { TimeWindow } from '$lib/HomeTracker';
    import { selectedTimeWindow } from '../store';

    interface Props {
        onSelect: (newTimeWindow: TimeWindow) => void;
    }
    const { onSelect }: Props = $props();

    const ALLTIME_START_MS = new Date('2024-08-30T00:00:00Z').getTime();

    const authenticatedOptions = [
        { name: '30 minutes', value: '30m' },
        { name: '3 hours', value: '3h' },
        { name: '12 hours', value: '12h' },
        { name: '1 day', value: '1d' },
        { name: '3 days', value: '3d' },
        { name: '7 days', value: '7d' },
        { name: '2 weeks', value: '2w' },
        { name: '1 month', value: '1M' },
        { name: '2 month', value: '2M' },
        { name: '6 month', value: '6M' },
        { name: 'All time', value: 'alltime' }
    ];

    const unauthenticatedOptions = [
        { name: '30 minutes', value: '30m' },
        { name: '3 hours', value: '3h' },
        { name: '12 hours', value: '12h' },
        { name: '1 day', value: '1d' },
        { name: '3 days', value: '3d' },
        { name: '7 days', value: '7d' },
        { name: '2 weeks', value: '2w' }
    ];

    const options = $user ? authenticatedOptions : unauthenticatedOptions;

    const MINUTE = 60_000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;

    const offsetMap: Record<string, number> = {
        '30m': 30 * MINUTE,
        '3h': 3 * HOUR,
        '12h': 12 * HOUR,
        '1d': DAY,
        '3d': 3 * DAY,
        '7d': 7 * DAY,
        '2w': 14 * DAY,
        '1M': 30 * DAY,
        '2M': 60 * DAY,
        '6M': 182 * DAY
    };

    const toTimeWindow = (value: string): TimeWindow => {
        const now = Date.now();
        if (value === 'alltime') return { startDateMs: ALLTIME_START_MS, endDateMs: now };
        return { startDateMs: now - offsetMap[value], endDateMs: now };
    };

    let selectedValue = $state('1d');

    const handleChange = () => {
        const tw = toTimeWindow(selectedValue);
        selectedTimeWindow.set(tw);
        onSelect(tw);
    };
</script>

<div class="time-window-select">
    <label for="time-window-select" class="far fa-calendar-alt"></label>
    <select id="time-window-select" bind:value={selectedValue} onchange={handleChange}>
        {#each options as option}
            <option value={option.value}>{option.name}</option>
        {/each}
    </select>
</div>

<style>
    .time-window-select {
        display: flex;
        flex-wrap: wrap;
        justify-content: stretch;
        align-items: end;
        gap: 5px;
    }
</style>
