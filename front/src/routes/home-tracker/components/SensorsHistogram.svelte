<script lang="ts">
    import {
        getAllSensorsWithLatestLog,
        getHistogramData,
        type TimeWindow
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
        const histogramData = await getHistogramData($selectedTimeWindow);
        const sensorsDetails = await getAllSensorsWithLatestLog();
        return { histogramData, sensorsDetails };
    };

    let apiData = refreshData($selectedTimeWindow);
</script>

<h1>History</h1>
{#if $user}
    <TimeWindowSelection on:select={(event) => (apiData = refreshData(event.detail))} />
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
{:else}
    <Notice item={{ level: 'info', header: 'Login to access historical data' }} />
{/if}
