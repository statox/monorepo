<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import { getSensorsMetadata, type TimeWindow } from '$lib/HomeTracker';
    import SensorSummary from './SensorSummary.svelte';
    import { selectedTimeWindow } from '../store';

    const refreshData = async (timeWindowInput: TimeWindow) => {
        selectedTimeWindow.set(timeWindowInput);
        const sensorsDetails = await getSensorsMetadata();
        return sensorsDetails;
    };

    let apiData = $state(refreshData($selectedTimeWindow));

    document.addEventListener('HomeTracker-RefreshData', () => {
        apiData = refreshData($selectedTimeWindow);
    });
</script>

<div class="container">
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
