<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageNameStore } from '$lib/components/Header';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import SensorsHistogram from './components/SensorsHistogram.svelte';
    import WeatherForecast from './components/WeatherForecast.svelte';
    import TimeControls from './components/TimeControls.svelte';
    import { isAllowedForUser, user } from '$lib/auth2';
    import { Notice } from '$lib/components/Notice';

    pageNameStore.set('Home Tracker');

    let userIsAllowed = $derived(isAllowedForUser('homeTracker', $user));
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" iconPath="/hometracker.png" />

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
