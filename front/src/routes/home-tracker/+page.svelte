<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getHomeTrackerLatest } from '$lib/HomeTracker/api';
    import SensorView from './components/SensorView.svelte';

    let latestDataAPI = getHomeTrackerLatest();
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" />

<h2>Home Tracker</h2>

{#await latestDataAPI}
    <p>Loading data</p>
{:then latestData}
    {#each Object.keys(latestData.recordsBySensor) as sensor}
        <SensorView sensorName={sensor} records={latestData.recordsBySensor[sensor]} />
    {/each}
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}
