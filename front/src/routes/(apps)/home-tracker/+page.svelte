<script lang="ts">
    import { DateTime } from 'luxon';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageNameStore } from '$lib/components/Header';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import SensorsHistogram from './components/SensorsHistogram.svelte';
    import WeatherForecast from './components/WeatherForecast.svelte';
    import { formatRecordTimestampToHuman } from '$lib/HomeTracker';

    pageNameStore.set('Home Tracker');

    let lastRefreshDate: DateTime = $state(DateTime.now());
    const triggerRefreshInChildren = () => {
        const event = new CustomEvent('HomeTracker-RefreshData');
        document.dispatchEvent(event);
        lastRefreshDate = DateTime.now();
    };
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" iconPath="/hometracker.png" />

<div class="content">
    <div>
        <span style="font-weight: bolder">Last Refresh</span>
        <span>{formatRecordTimestampToHuman(lastRefreshDate?.toSeconds()) || 'NA'}</span>
        <button aria-label="update data" onclick={triggerRefreshInChildren}>
            <i class="fas fa-sync-alt"></i>
        </button>
    </div>

    <SensorsSummary />
    <SensorsHistogram />
    <WeatherForecast />
</div>

<style>
    .content {
        display: flex;
        flex-flow: column;
        row-gap: 2em;
    }
</style>
