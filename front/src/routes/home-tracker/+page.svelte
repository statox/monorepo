<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getHomeTrackerLatest } from '$lib/HomeTracker/api';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import SensorView from './components/SensorView.svelte';
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" />

<h2>Home Tracker</h2>

{#await getHomeTrackerLatest()}
    <p>Loading data</p>
{:then latestData}
    {#each Object.keys(latestData.recordsBySensor) as sensor}
        <SensorsSummary recordsBySensor={latestData.recordsBySensor} />
        <SensorView sensorName={sensor} records={latestData.recordsBySensor[sensor]} />
    {/each}
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}
