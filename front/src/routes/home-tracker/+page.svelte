<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getHomeTrackerLatest, getHomeTrackerSensors } from '$lib/HomeTracker/api';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import MultiSensorsGraph from './components/MultiSensorsGraph.svelte';
    import { DateTime } from 'luxon';
    import type { HomeTrackerTimeData } from '$lib/HomeTracker/types';
    import { pageNameStore } from '$lib/components/Header';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import TimeWindowSelection from './components/TimeWindowSelection.svelte';

    pageNameStore.set('Home Tracker');

    type TimeWindow = '3h' | '12h' | '1d' | '3d' | '7d' | '2w' | '1m';
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

{#if $user}
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
        <TimeWindowSelection on:select={(event) => (apiData = refreshData(event.detail))} />
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
        <p>{error}</p>
    {/await}
{:else}
    <Notice item={{ level: 'info', header: 'Login to access data' }} />
{/if}
