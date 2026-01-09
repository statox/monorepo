<script lang="ts">
    import {
        formatRecordTimestampToHumanWithSeconds,
        formatRecordTimestampToRelative
    } from '$lib/HomeTracker';
    import type { SensorMetadata } from '$lib/HomeTracker';
    import Metadata from './Metadata.svelte';
    import Readings from './Readings.svelte';
    import { DateTime } from 'luxon';
    import { onDestroy } from 'svelte';
    import { ProgressIndicatorDisk } from '$lib/components/ProgressIndicatorDisk';

    interface Props {
        sensor: SensorMetadata;
    }

    let { sensor }: Props = $props();

    const isInAlert = sensor.lastAlertDateUnix != null;

    let displayMode: 'readings' | 'metadata' = $state('readings');
    const changeDisplayMode = () => {
        if (displayMode === 'readings') {
            displayMode = 'metadata';
        } else {
            displayMode = 'readings';
        }
    };

    let timestampDisplayFormatRelative = $state(true);
    let formatedLastLogTimestamp = $state('NA');
    let formatedLastAlertTimestamp = $state('NA');

    const expectedNextLogTimestamp = sensor.lastSyncDateUnix + sensor.sleepTimeSec;
    let nowSec = DateTime.now().toSeconds();
    let nextLogProgress = $state(1 - (expectedNextLogTimestamp - nowSec) / sensor.sleepTimeSec);

    let nextLogProgressInterval = setInterval(() => {
        nowSec = DateTime.now().toSeconds();
        nextLogProgress = 1 - (expectedNextLogTimestamp - nowSec) / sensor.sleepTimeSec;

        const formatFunction = timestampDisplayFormatRelative
            ? formatRecordTimestampToRelative
            : formatRecordTimestampToHumanWithSeconds;

        formatedLastLogTimestamp =
            formatFunction(sensor.lastSyncDateUnix) || '(error getting last timestamp)';

        if (sensor.lastAlertDateUnix) {
            formatedLastAlertTimestamp =
                formatFunction(sensor.lastAlertDateUnix) || '(error getting last timestamp)';
        }
    }, 500);

    onDestroy(() => {
        if (nextLogProgressInterval !== null) {
            clearInterval(nextLogProgressInterval);
        }
    });

    const handleImageNotFound = (event: Event) => {
        if (!event?.target) {
            return;
        }
        // @ts-expect-error find out the proper typing for this
        event.target.src = '/hometracker/sensors/icon_debug.png';
    };
</script>

<div class="container" class:is-in-alert={isInAlert} style="--sensor-color: {sensor.hexColor}">
    <button class="sensor-icon" onclick={changeDisplayMode}>
        <img
            class="sensor-icon-img"
            src={sensor.iconPath}
            title="Edit settings for {sensor.sensorName}"
            alt="Edit settings for {sensor.sensorName}"
            onerror={handleImageNotFound}
        />
    </button>

    <div class="sensor-data">
        <div class="sensor-data-header">
            <div class="sensor-name">
                {sensor.sensorName}
            </div>
            <button
                class="sensor-last-sync-timestamp"
                title="Change date format"
                onclick={() => (timestampDisplayFormatRelative = !timestampDisplayFormatRelative)}
            >
                {formatedLastLogTimestamp}
                &nbsp;
                <ProgressIndicatorDisk progress={nextLogProgress} />
            </button>
        </div>

        {#if isInAlert}
            <div class="sensor-alert-notice">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Alert {formatedLastAlertTimestamp}</span>
            </div>
        {/if}

        {#if displayMode === 'readings'}
            <Readings {sensor} />
        {:else}
            <Metadata {sensor} />
        {/if}
    </div>
</div>

<style>
    .container {
        border: solid 2px;
        border-color: var(--sensor-color);
        border-radius: 5px;

        display: flex;
        flex-wrap: wrap;
        align-items: start;
        justify-content: flex-start;
        gap: 1em;

        padding: 0.5em;
    }

    .is-in-alert {
        background-color: rgba(var(--nc-error-rgb), 0.1);
    }

    .sensor-alert-notice {
        color: var(--nc-error);
    }

    .sensor-icon-img {
        border-radius: 15%;
        max-height: 100px;

        padding: 0;
        margin: 0;
        border: 0;
    }

    .sensor-icon {
        background-color: transparent;
    }

    .sensor-data {
        flex-grow: 1;
    }

    .sensor-data-header {
        display: flex;
        gap: 1em;
        flex-grow: 1;

        align-items: baseline;
        flex-wrap: wrap;
    }

    .sensor-name {
        color: var(--sensor-color);
        font-size: xx-large;
    }

    .sensor-last-sync-timestamp,
    .sensor-last-sync-timestamp:hover {
        background-color: transparent;
        color: var(--nc-tx-2);

        display: flex;
        justify-content: end;
        flex-grow: 1;
    }
</style>
