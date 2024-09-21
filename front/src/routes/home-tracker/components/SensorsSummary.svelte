<script lang="ts">
    import type { SensorState } from '$lib/HomeTracker/types';
    import SensorSummary from './SensorSummary.svelte';

    export let sensorsData: SensorState[];
</script>

<div class="container">
    {#each sensorsData as sensor}
        <SensorSummary {sensor} />
    {/each}
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1em;
    }

    @media screen and (max-width: 750px) {
        .container {
            grid-template-columns: 1fr;
        }
    }
</style>
