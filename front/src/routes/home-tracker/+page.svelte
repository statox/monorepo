<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import {
        formatRecordTimestampToHuman,
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
    import { selectedTimeWindow } from './store';

    pageNameStore.set('Home Tracker');

    let lastRefreshDate: DateTime;

    const refreshData = async (timeWindowInput: TimeWindow) => {
        selectedTimeWindow.set(timeWindowInput);
        const histogramData = await getHistogramData($selectedTimeWindow);
        const sensorsDetails = await getAllSensorsWithLatestLog();
        lastRefreshDate = DateTime.now();
        return { histogramData, sensorsDetails };
    };

    let apiData = refreshData($selectedTimeWindow);

    setInterval(() => (apiData = refreshData($selectedTimeWindow)), 5 * 60 * 1000);
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" iconPath="/hometracker.png" />

{#if $user}
    <div>
        <span style={'font-weight: bolder'}>Last Refresh</span>
        <span>{formatRecordTimestampToHuman(lastRefreshDate?.toSeconds()) || 'NA'}</span>
        <button on:click={() => (apiData = refreshData($selectedTimeWindow))}>
            <i class="fas fa-sync-alt"></i>
        </button>
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
