<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { HomeTrackerHistogramData, SensorState } from '$lib/HomeTracker';
    import TimeWindowSelection from './TimeWindowSelection.svelte';
    import { MultiSensorsGraph, type GraphType } from './MultiSensorsGraph';

    export let sensorsData: SensorState[];
    export let sensorNames: string[];
    export let histogramData: HomeTrackerHistogramData;

    const dispatch = createEventDispatcher();

    const graphs: GraphType[] = [
        'temperature',
        'humidity',
        'pressure',
        'battery',
        'internalTemperature',
        'internalHumidity'
    ];
</script>

<TimeWindowSelection on:select={(event) => dispatch('select', event.detail)} />
<div>
    {#each graphs as graphType}
        <MultiSensorsGraph {sensorsData} {histogramData} {sensorNames} {graphType} />
    {/each}
</div>
