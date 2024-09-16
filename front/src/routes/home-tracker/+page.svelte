<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getHomeTrackerLatest, getHomeTrackerSensors } from '$lib/HomeTracker/api';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import MultiSensorsGraph from './components/MultiSensorsGraph.svelte';
    import { DateTime } from 'luxon';
    import type { HomeTrackerTimeData } from '$lib/HomeTracker/types';
    import { pageNameStore } from '$lib/components/Header';

    pageNameStore.set('Home Tracker');

    type TimeWindow = '3h' | '12h' | '1d' | '3d' | '7d';
    let lastRefreshDate: DateTime;
    let timeWindow: TimeWindow = '1d';

    const metrics = [
        'tempCelsius',
        'humidity',
        'pressurehPa',
        'batteryCharge'
    ] as (keyof HomeTrackerTimeData)[];

    const refreshData = async (timeWindowInput: TimeWindow) => {
        timeWindow = timeWindowInput;
        const histogramData = await getHomeTrackerLatest(timeWindow);
        const sensorsDetails = await getHomeTrackerSensors();
        lastRefreshDate = DateTime.now();
        return { histogramData, sensorsDetails };
    };

    let apiData = refreshData(timeWindow);
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" />

<div>
    <button on:click={() => (apiData = refreshData(timeWindow))}>Refresh</button>
    <span style={'font-weight: bolder'}>Last Refresh</span>
    <span>{lastRefreshDate?.toFormat('dd/MM HH:mm') || 'NA'}</span>
</div>
<br />

{#await apiData}
    <p>Loading sensors data</p>
{:then { histogramData, sensorsDetails }}
    <SensorsSummary sensorsData={sensorsDetails.sensors} />
    <br />
    <div class="time-window-select">
        <button class:selected={timeWindow === '3h'} on:click={() => (apiData = refreshData('3h'))}>
            3 hours
        </button>
        <button
            class:selected={timeWindow === '12h'}
            on:click={() => (apiData = refreshData('12h'))}
        >
            12 hours
        </button>
        <button class:selected={timeWindow === '1d'} on:click={() => (apiData = refreshData('1d'))}>
            1 day
        </button>
        <button class:selected={timeWindow === '3d'} on:click={() => (apiData = refreshData('3d'))}>
            3 days
        </button>
        <button class:selected={timeWindow === '7d'} on:click={() => (apiData = refreshData('7d'))}>
            7 days
        </button>
    </div>
    <br />
    {#each metrics as metric}
        <MultiSensorsGraph
            sensorsData={sensorsDetails.sensors}
            histogramData={histogramData.histogramData}
            sensorNames={histogramData.sensorNames}
            {metric}
        />
    {/each}
{:catch error}
    <p>Something went wrong getting sensor data</p>
    <p>{JSON.stringify(error)}</p>
{/await}

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
