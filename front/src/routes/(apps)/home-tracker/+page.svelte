<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageMetadataStore } from '$lib/components/Header';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import SensorsHistogram from './components/SensorsHistogram.svelte';
    import WeatherForecast from './components/WeatherForecast.svelte';
    import TimeControls from './components/TimeControls.svelte';
    import { AuthGuard } from '$lib/components/AuthGuard';

    const pageMetadata = {
        name: 'Home Tracker',
        description: 'Recording of my sensors',
        iconPath: '/hometracker.png',
        showAuthInHeader: true
    } as const;
    pageMetadataStore.set(pageMetadata);
</script>

<HeadIOS
    title={pageMetadata.name}
    description={pageMetadata.description}
    iconPath={pageMetadata.iconPath}
/>

<div class="content">
    <TimeControls />
    <SensorsSummary />

    <AuthGuard requiredScope="homeTracker" message="Login to access historical data">
        <SensorsHistogram />
        <WeatherForecast />
    </AuthGuard>
</div>

<style>
    .content {
        display: flex;
        flex-flow: column;
        row-gap: 2em;
    }
</style>
