<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { selectedTimeWindow } from '../store';

    const dispatch = createEventDispatcher();

    const options = [
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
</script>

<div class="time-window-select">
    <span class="section-title">Time window</span>
    <div>
        <label for="time-window-select" class="far fa-calendar-alt"></label>
        <select
            id="time-window-select"
            bind:value={$selectedTimeWindow}
            on:change={() => dispatch('select', $selectedTimeWindow)}
        >
            {#each options as option}
                <option value={option.value}>{option.name}</option>
            {/each}
        </select>
    </div>
</div>

<style>
    .time-window-select {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: baseline;
        gap: 20px;
    }
    .section-title {
        color: var(--nc-tx-1);
        font-weight: bold;
        font-size: x-large;
    }
</style>
