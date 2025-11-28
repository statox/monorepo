<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageMetadataStore } from '$lib/components/Header';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import SensorsHistogram from './components/SensorsHistogram.svelte';
    import WeatherForecast from './components/WeatherForecast.svelte';
    import TimeControls from './components/TimeControls.svelte';
    import { isAllowedForUser, user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';

    const pageMetadata = {
        name: 'Home Tracker',
        description: 'Recording of my sensors',
        iconPath: '/hometracker.png'
    };
    pageMetadataStore.set(pageMetadata);

    let userIsAllowed = $derived(isAllowedForUser('homeTracker', $user));
</script>

<HeadIOS
    title={pageMetadata.name}
    description={pageMetadata.description}
    iconPath={pageMetadata.iconPath}
/>

<div class="content">
    <TimeControls />
    <SensorsSummary />

    {#if !userIsAllowed}
        <Notice item={{ level: 'info', header: 'Login to access historical data' }} />
    {:else}
        <SensorsHistogram />
        <WeatherForecast />
    {/if}
</div>

<style>
    .content {
        display: flex;
        flex-flow: column;
        row-gap: 2em;
    }
</style>
