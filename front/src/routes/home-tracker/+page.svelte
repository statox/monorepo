<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getHomeTrackerLatest, getHomeTrackerSensors } from '$lib/HomeTracker/api';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import MultiSensorsGraph from './components/MultiSensorsGraph.svelte';
    import type {
        HomeTrackerLatestResponse,
        HomeTrackerSensorsResponse
    } from '$lib/HomeTracker/types';
    import { DateTime } from 'luxon';

    type TimeWindow = '3h' | '12h' | '1d' | '3d' | '7d';
    let latestDataApi: Promise<HomeTrackerLatestResponse>;
    let sensorsDetailsApi: Promise<HomeTrackerSensorsResponse>;
    let lastRefreshDate: DateTime;
    let timeWindow: TimeWindow = '1d';

    const refreshData = (timeWindowInput: TimeWindow) => {
        timeWindow = timeWindowInput;
        latestDataApi = getHomeTrackerLatest(timeWindow);
        sensorsDetailsApi = getHomeTrackerSensors();
        lastRefreshDate = DateTime.now();
    };

    refreshData(timeWindow);
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" />

<h2>Home Tracker</h2>

<div>
    <button on:click={() => refreshData(timeWindow)}>Refresh</button>
    <span style={'font-weight: bolder'}>Last Refresh</span>
    <span>{lastRefreshDate.toFormat('dd/MM HH:mm')}</span>
</div>
<br />

{#await sensorsDetailsApi}
    <p>Loading sensors data</p>
{:then sensorsDetails}
    <SensorsSummary sensorsData={sensorsDetails.sensors} />
    <br />
{:catch error}
    <p>Something went wrong getting sensor data</p>
    <p>{JSON.stringify(error)}</p>
{/await}

{#await latestDataApi}
    <p>Loading histogram data</p>
{:then latestData}
    <div class="time-window-select">
        <button class:selected={timeWindow === '3h'} on:click={() => refreshData('3h')}>
            3 hours
        </button>
        <button class:selected={timeWindow === '12h'} on:click={() => refreshData('12h')}>
            12 hours
        </button>
        <button class:selected={timeWindow === '1d'} on:click={() => refreshData('1d')}>
            1 day
        </button>
        <button class:selected={timeWindow === '3d'} on:click={() => refreshData('3d')}>
            3 days
        </button>
        <button class:selected={timeWindow === '7d'} on:click={() => refreshData('7d')}>
            7 days
        </button>
    </div>
    <br />
    <MultiSensorsGraph
        histogramData={latestData.histogramData}
        sensorNames={latestData.sensorNames}
        metric="tempCelsius"
    />
    <MultiSensorsGraph
        histogramData={latestData.histogramData}
        sensorNames={latestData.sensorNames}
        metric="humidity"
    />
    <MultiSensorsGraph
        histogramData={latestData.histogramData}
        sensorNames={latestData.sensorNames}
        metric="pressurehPa"
    />
    <MultiSensorsGraph
        histogramData={latestData.histogramData}
        sensorNames={latestData.sensorNames}
        metric="batteryCharge"
    />
{:catch error}
    <p>Something went wrong getting histogram data</p>
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
