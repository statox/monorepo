<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    type TimeWindow = '3h' | '12h' | '1d' | '3d' | '7d' | '2w' | '1m';
    let timeWindow: TimeWindow = '1d';

    const dispatch = createEventDispatcher();

    const options = [
        { name: '3 hours', value: '3h' },
        { name: '12 hours', value: '12h' },
        { name: '1 day', value: '1d' },
        { name: '3 days', value: '3d' },
        { name: '7 days', value: '7d' },
        { name: '2 weeks', value: '2w' },
        { name: '1 month', value: '1m' }
    ];
</script>

<div class="time-window-select">
    {#each options as option}
        <button
            class:selected={timeWindow === option.value}
            on:click={() => dispatch('select', option.value)}
        >
            {option.name}
        </button>
    {/each}
</div>

<style>
    button.selected {
        background: var(--nc-lk-2);
    }
    .time-window-select {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 20px;
    }
    @media (max-width: 768px) {
        .time-window-select {
            justify-content: space-between;
        }
    }
</style>
