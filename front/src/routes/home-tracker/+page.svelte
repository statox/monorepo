<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { getHomeTrackerLatest } from '$lib/HomeTracker/api';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import MultiSensorsGraph from './components/MultiSensorsGraph.svelte';
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" />

<h2>Home Tracker</h2>

{#await getHomeTrackerLatest()}
    <p>Loading data</p>
{:then latestData}
    <SensorsSummary recordsBySensor={latestData.recordsBySensor} />
    <br />
    <MultiSensorsGraph recordsBySensor={latestData.recordsBySensor} metric="temperature" />
    <MultiSensorsGraph recordsBySensor={latestData.recordsBySensor} metric="humidity" />
    <MultiSensorsGraph recordsBySensor={latestData.recordsBySensor} metric="pressure" />
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}
