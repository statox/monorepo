<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import {
        formatRecordTimestampToHuman,
        getAllSensorsWithLatestLog,
        type TimeWindow
    } from '$lib/HomeTracker';
    import SensorSummary from './SensorSummary.svelte';
    import { selectedTimeWindow } from '../store';
    import { DateTime } from 'luxon';

    let lastRefreshDate: DateTime = $state(DateTime.now());

    const refreshData = async (timeWindowInput: TimeWindow) => {
        selectedTimeWindow.set(timeWindowInput);
        const sensorsDetails = await getAllSensorsWithLatestLog();
        lastRefreshDate = DateTime.now();
        return sensorsDetails;
    };

    let apiData = $state(refreshData($selectedTimeWindow));

    setInterval(() => (apiData = refreshData($selectedTimeWindow)), 5 * 60 * 1000);
</script>

<div class="container">
    <div>
        <span style="font-weight: bolder">Last Refresh</span>
        <span>{formatRecordTimestampToHuman(lastRefreshDate?.toSeconds()) || 'NA'}</span>
        <button
            aria-label="update data"
            onclick={() => (apiData = refreshData($selectedTimeWindow))}
        >
            <i class="fas fa-sync-alt"></i>
        </button>
    </div>

    <br />
    {#await apiData}
        <p>Loading sensors data</p>
    {:then sensordDetails}
        {#each sensordDetails.sensors as sensor}
            <SensorSummary {sensor} />
        {/each}
    {:catch error}
        <Notice
            item={{
                level: 'error',
                header: 'Something went wrong getting sensor data',
                message: error
            }}
        />
    {/await}
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
