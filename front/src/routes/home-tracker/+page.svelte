<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import {
        getAllSensorsWithLatestLog,
        getHistogramData,
        type TimeWindow
    } from '$lib/HomeTracker';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import { DateTime } from 'luxon';
    import { pageNameStore } from '$lib/components/Header';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import SensorsHistogram from './components/SensorsHistogram.svelte';

    pageNameStore.set('Home Tracker');

    let lastRefreshDate: DateTime;
    let timeWindow: TimeWindow = '1d';

    const refreshData = async (timeWindowInput: TimeWindow) => {
        timeWindow = timeWindowInput;
        const histogramData = await getHistogramData(timeWindow);
        const sensorsDetails = await getAllSensorsWithLatestLog();
        lastRefreshDate = DateTime.now();
        return { histogramData, sensorsDetails };
    };

    let apiData = refreshData(timeWindow);
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" iconPath="/hometracker.png" />

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
        <div class="content">
            <SensorsSummary sensorsData={sensorsDetails.sensors} />
            <SensorsHistogram
                sensorsData={sensorsDetails.sensors}
                histogramData={histogramData.histogramData}
                sensorNames={histogramData.sensorNames}
                on:select={(event) => (apiData = refreshData(event.detail))}
            />
        </div>
    {:catch error}
        <Notice
            item={{
                level: 'error',
                header: 'Something went wrong getting sensor data',
                message: error
            }}
        />
    {/await}
{:else}
    <Notice item={{ level: 'info', header: 'Login to access data' }} />
{/if}

<style>
    .content {
        display: flex;
        flex-flow: column;
        row-gap: 2em;
    }
</style>
