<script lang="ts">
    import {
        getAllSensorsWithLatestLog,
        getHistogramData,
        getHistogramDataPublic,
        type TimeWindow,
        type TimeWindowPublic
    } from '$lib/HomeTracker';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import { selectedTimeWindow } from '../store';
    import TimeWindowSelection from './TimeWindowSelection.svelte';
    import { MultiSensorsGraph, type GraphType } from './MultiSensorsGraph';

    const graphs: GraphType[] = [
        'temperature',
        'humidity',
        'pressure',
        'battery',
        'internalTemperature',
        'internalHumidity'
    ];

    const refreshData = async (timeWindowInput: TimeWindow) => {
        selectedTimeWindow.set(timeWindowInput);
        const histogramDataGetter = $user
            ? () => getHistogramData($selectedTimeWindow)
            : () => getHistogramDataPublic($selectedTimeWindow as TimeWindowPublic);
        const histogramData = await histogramDataGetter();
        const sensorsDetails = await getAllSensorsWithLatestLog();
        return { histogramData, sensorsDetails };
    };

    let apiData = $state(refreshData($selectedTimeWindow));

    document.addEventListener('HomeTracker-RefreshData', () => {
        apiData = refreshData($selectedTimeWindow);
    });
</script>

<h1 class="title">
    <span>History</span>
    <TimeWindowSelection on:select={(event) => (apiData = refreshData(event.detail))} />
</h1>

{#await apiData}
    <p>Loading history</p>
{:then { histogramData, sensorsDetails }}
    <div>
        {#each graphs as graphType}
            <MultiSensorsGraph
                sensorsData={sensorsDetails.sensors}
                histogramData={histogramData.histogramData}
                sensorNames={histogramData.sensorNames}
                {graphType}
            />
        {/each}
    </div>
{:catch error}
    <Notice
        item={{
            level: 'error',
            header: 'Something went wrong getting history',
            message: error
        }}
    />
{/await}

<style>
    .title {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
    }
</style>
