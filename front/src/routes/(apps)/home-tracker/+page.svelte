<script lang="ts">
    import { DateTime } from 'luxon';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageNameStore } from '$lib/components/Header';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import SensorsHistogram from './components/SensorsHistogram.svelte';
    import WeatherForecast from './components/WeatherForecast.svelte';
    import { formatRecordTimestampToHuman } from '$lib/HomeTracker';
    import { ButtonSwitch } from '$lib/components/ButtonSwitch';

    pageNameStore.set('Home Tracker');

    let enableAutoRefresh = $state(false);
    // TODO find way to properly type interval
    let autoRefreshInterval: any | null = null;
    let lastRefreshDate: DateTime = $state(DateTime.now());

    const triggerRefreshInChildren = () => {
        const event = new CustomEvent('HomeTracker-RefreshData');
        document.dispatchEvent(event);
        lastRefreshDate = DateTime.now();
    };
    const toggleAutoRefresh = () => {
        enableAutoRefresh = !enableAutoRefresh;

        if (enableAutoRefresh) {
            const AUTO_REFRESH_INTERVAL = 1000 * 60 * 5;
            autoRefreshInterval = setInterval(triggerRefreshInChildren, AUTO_REFRESH_INTERVAL);
            return;
        }

        if (autoRefreshInterval !== null) {
            clearInterval(autoRefreshInterval);
        }
    };
</script>

<HeadIOS title="Home Tracker" description="Recording of my sensors" iconPath="/hometracker.png" />

<div class="content">
    <div class="time-controls">
        <div>
            <span style="font-weight: bolder">Last Refresh</span>
            <span>{formatRecordTimestampToHuman(lastRefreshDate?.toSeconds()) || 'NA'}</span>
            <button aria-label="update data" onclick={triggerRefreshInChildren}>
                <i class="fas fa-sync-alt"></i>
            </button>
        </div>
        <ButtonSwitch
            value={enableAutoRefresh.toString()}
            label="Auto refresh"
            on:change={toggleAutoRefresh}
            design="slider"
        />
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
    .time-controls {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
    }
</style>
