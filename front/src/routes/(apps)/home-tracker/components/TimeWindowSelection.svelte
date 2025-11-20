<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/auth';
    import { selectedTimeWindow } from '../store';

    const dispatch = createEventDispatcher();

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
</script>

<div class="time-window-select">
    <label for="time-window-select" class="far fa-calendar-alt"></label>
    <select
        id="time-window-select"
        bind:value={$selectedTimeWindow}
        onchange={() => dispatch('select', $selectedTimeWindow)}
    >
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
