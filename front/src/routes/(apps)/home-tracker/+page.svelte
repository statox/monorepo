<script lang="ts">
    import { DateTime } from 'luxon';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageNameStore } from '$lib/components/Header';
    import SensorsSummary from './components/SensorsSummary.svelte';
    import SensorsHistogram from './components/SensorsHistogram.svelte';
    import WeatherForecast from './components/WeatherForecast.svelte';
    import { formatRecordTimestampToHuman } from '$lib/HomeTracker';
    import { ButtonSwitch } from '$lib/components/ButtonSwitch';
    import { ProgressIndicatorCircular } from '$lib/components/ProgressIndicatorCircular';
    import { onDestroy } from 'svelte';

    pageNameStore.set('Home Tracker');

    let enableAutoRefresh = $state(false);
    let refreshProgress = $state(0);
    // TODO find way to properly type interval
    let autoRefreshInterval: any | null = null;
    let lastRefreshDate: DateTime = $state(DateTime.now());
    let nextRefreshDate: DateTime | null = $state(null);

    const AUTO_REFRESH_INTERVAL = 1000 * 60 * 1;

    const triggerRefreshInChildren = () => {
        const event = new CustomEvent('HomeTracker-RefreshData');
        document.dispatchEvent(event);
        lastRefreshDate = DateTime.now();
        nextRefreshDate = lastRefreshDate.plus({ milliseconds: AUTO_REFRESH_INTERVAL });
    };

    const toggleAutoRefresh = () => {
        enableAutoRefresh = !enableAutoRefresh;

        if (autoRefreshInterval !== null) {
            clearInterval(autoRefreshInterval);
        }

        if (enableAutoRefresh) {
            triggerRefreshInChildren();

            autoRefreshInterval = setInterval(() => {
                const nowMillis = DateTime.now().toMillis();
                const nextRefreshMillis = nextRefreshDate?.toMillis() || 0;

                if (nextRefreshMillis < nowMillis) {
                    triggerRefreshInChildren();
                }

                refreshProgress = (nextRefreshMillis - nowMillis) / AUTO_REFRESH_INTERVAL;
            }, 700);
            return;
        }
    };

    onDestroy(() => {
        if (autoRefreshInterval !== null) {
            clearInterval(autoRefreshInterval);
        }
    });
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
        <div class="auto-refresh-controls">
            <ButtonSwitch
                value={enableAutoRefresh.toString()}
                label="Auto refresh"
                on:change={toggleAutoRefresh}
                design="slider"
            />
            {#if enableAutoRefresh}
                <ProgressIndicatorCircular progress={refreshProgress} />
            {/if}
        </div>
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
    .auto-refresh-controls {
        display: flex;
        gap: 10px;
        align-items: center;
    }
</style>
