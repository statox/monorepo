<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getHomeTrackerLatest } from '$lib/HomeTracker/api';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import MultiSensorsGraph from './components/MultiSensorsGraph.svelte';

    let latestDataApi = getHomeTrackerLatest('1d');
    const refreshData = (timeWindow: '3h' | '12h' | '1d' | '3d' | '7d') =>
        (latestDataApi = getHomeTrackerLatest(timeWindow));
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" />

<h2>Home Tracker</h2>

{#await latestDataApi}
    <p>Loading data</p>
{:then latestData}
    <SensorsSummary recordsBySensor={latestData.recordsBySensor} />
    <br />
    <div class="time-window-select">
        <button on:click={() => refreshData('3h')}>3 hours</button>
        <button on:click={() => refreshData('12h')}>12 hours</button>
        <button on:click={() => refreshData('1d')}>1 day</button>
        <button on:click={() => refreshData('3d')}>3 days</button>
        <button on:click={() => refreshData('7d')}>7 days</button>
    </div>
    <br />
    <MultiSensorsGraph recordsBySensor={latestData.recordsBySensor} metric="temperature" />
    <MultiSensorsGraph recordsBySensor={latestData.recordsBySensor} metric="humidity" />
    <MultiSensorsGraph recordsBySensor={latestData.recordsBySensor} metric="pressure" />
    <MultiSensorsGraph recordsBySensor={latestData.recordsBySensor} metric="battery" />
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}

<style>
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
