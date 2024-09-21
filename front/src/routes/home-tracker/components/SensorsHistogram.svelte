<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type {
        HomeTrackerHistogramData,
        HomeTrackerTimeData,
        SensorState
    } from '$lib/HomeTracker';
    import MultiSensorsGraph from './MultiSensorsGraph.svelte';
    import TimeWindowSelection from './TimeWindowSelection.svelte';

    export let sensorsData: SensorState[];
    export let sensorNames: string[];
    export let histogramData: HomeTrackerHistogramData;

    const dispatch = createEventDispatcher();

    const metrics = [
        'tempCelsius',
        'humidity',
        'pressurehPa',
        'batteryCharge'
    ] as (keyof HomeTrackerTimeData)[];
</script>

<TimeWindowSelection on:select={(event) => dispatch('select', event.detail)} />
<div>
    {#each metrics as metric}
        <MultiSensorsGraph {sensorsData} {histogramData} {sensorNames} {metric} />
    {/each}
</div>
