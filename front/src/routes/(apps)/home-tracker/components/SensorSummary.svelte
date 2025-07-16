<script lang="ts">
    import { ValueWithUnit } from '$lib/components/ValueWithUnit';
    import {
        formatRecordTimestampToHumanWithSeconds,
        formatRecordTimestampToRelative
    } from '$lib/HomeTracker';
    import type { SensorMetadata } from '$lib/HomeTracker/types';
    import DataTrend from './DataTrend.svelte';

    interface Props {
        sensor: SensorMetadata;
    }

    let { sensor }: Props = $props();

    const isInAlert = sensor.lastAlertDateUnix != null;

    let timestampDisplayFormatRelative = $state(true);
    let formatedLastLogTimestamp = $state('NA');
    let formatedLastAlertTimestamp = $state('NA');

    $effect(() => {
        const formatFunction = timestampDisplayFormatRelative
            ? formatRecordTimestampToRelative
            : formatRecordTimestampToHumanWithSeconds;

        formatedLastLogTimestamp =
            formatFunction(sensor.lastSyncDateUnix) || '(error getting last timestamp)';

        formatedLastAlertTimestamp =
            formatFunction(sensor.lastAlertDateUnix) || '(error getting last timestamp)';
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
    <img
        class="sensor-icon"
        src={sensor.iconPath}
        title="{sensor.sensorName} icon"
        alt="{sensor.sensorName} icon"
        onerror={handleImageNotFound}
    />

    <div class="sensor-data">
        <div class="sensor-data-header">
            <div class="sensor-name">
                {sensor.sensorName}
            </div>
            <button
                class="sensor-last-sync-timestamp"
                onclick={() => (timestampDisplayFormatRelative = !timestampDisplayFormatRelative)}
            >
                {formatedLastLogTimestamp}
            </button>
        </div>

        {#if isInAlert}
            <div class="sensor-alert-notice">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Alert {formatedLastAlertTimestamp}</span>
            </div>
        {/if}

        <div class="sensor-data-records-container-with-trend">
            <i class="unit-icon fas fa-thermometer-half"></i>
            <ValueWithUnit value={sensor.lastLogData.tempCelsius} unitString="°C" precision={1} />
            <DataTrend
                oldValue={sensor.oneHourAgoLogData.tempCelsius || 0}
                newValue={sensor.lastLogData.tempCelsius || 0}
                oldTimestamp={sensor.oneHourAgoLogData.timestamp}
                newTimestamp={sensor.lastLogData.timestamp}
            />

            <i class="unit-icon fas fa-tint"></i>
            <ValueWithUnit value={sensor.lastLogData.humidity} unitString="%" precision={0} />
            <DataTrend
                oldValue={sensor.oneHourAgoLogData.humidity || 0}
                newValue={sensor.lastLogData.humidity || 0}
                oldTimestamp={sensor.oneHourAgoLogData.timestamp}
                newTimestamp={sensor.lastLogData.timestamp}
            />

            {#if sensor.lastLogData.pressurehPa}
                <i class="unit-icon fas fa-tachometer-alt"></i>
                <ValueWithUnit
                    value={sensor.lastLogData.pressurehPa}
                    unitString="hPa"
                    precision={0}
                />
                <i></i>
            {/if}
        </div>

        {#if sensor.lastLogData.internalTempCelsius || sensor.lastLogData.internalHumidity}
            <div class="sensor-data-records-container internal-data">
                <i class="unit-icon fas fa-thermometer-half"></i>
                <ValueWithUnit
                    value={sensor.lastLogData.internalTempCelsius}
                    unitString="°C"
                    precision={1}
                />

                <i class="unit-icon fas fa-tint"></i>
                <ValueWithUnit
                    value={sensor.lastLogData.internalHumidity}
                    unitString="%"
                    precision={0}
                />
            </div>
        {/if}

        {#if sensor.lastLogData.batteryPercent}
            <div class="sensor-data-records-container internal-data">
                <i
                    class="power-icon fas fa-bolt"
                    class:low-power-icon={sensor.lastLogData.batteryPercent < 10}
                ></i>
                <ValueWithUnit
                    value={sensor.lastLogData.batteryPercent}
                    unitString="%"
                    precision={0}
                />
            </div>
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

    .sensor-icon {
        border-radius: 15%;
        max-height: 100px;

        padding: 0;
        margin: 0;
        border: 0;
    }

    .sensor-data {
        flex-grow: 1;
    }

    .sensor-data-header {
        display: flex;
        gap: 1em;

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

    .sensor-data-records-container {
        display: grid;
        font-size: x-large;

        grid-template-columns: 2ch repeat(2, minmax(min-content, max-content));
        align-items: baseline;
    }
    .sensor-data-records-container-with-trend {
        display: grid;
        font-size: x-large;

        grid-template-columns: 2ch repeat(2, minmax(min-content, max-content)) 1fr;
        align-items: baseline;
    }
    .internal-data {
        font-size: medium;
        color: var(--nc-tx-1);
    }

    .unit-icon {
        font-size: large;
    }

    .power-icon {
        color: #cecb18;
    }

    .low-power-icon {
        color: var(--nc-error);
    }
</style>
