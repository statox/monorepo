<script lang="ts">
    import { ValueWithUnit } from '$lib/components/ValueWithUnit';
    import { formatRecordTimestampToRelative } from '$lib/HomeTracker';
    import type { DashboardSensorState } from '$lib/HomeTracker/types';

    interface Props {
        sensor: DashboardSensorState;
    }

    let { sensor }: Props = $props();

    const isInAlert = sensor.lastAlertDateUnix != null;

    let formatedLastLogTimestamp: string | null = $state('NA');
    let formatedLastAlertTimestamp: string | null = $state('NA');

    formatedLastLogTimestamp =
        formatRecordTimestampToRelative(sensor.lastSyncDateUnix) ||
        '(error getting last timestamp)';

    formatedLastAlertTimestamp =
        formatRecordTimestampToRelative(sensor.lastAlertDateUnix) ||
        '(error getting last timestamp)';

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
            <div>
                {formatedLastLogTimestamp}
            </div>
        </div>

        {#if isInAlert}
            <div class="sensor-alert-notice">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Alert {formatedLastAlertTimestamp}</span>
            </div>
        {/if}

        <div class="sensor-data-records-container">
            <i class="unit-icon fas fa-thermometer-half"></i>
            <ValueWithUnit value={sensor.lastLogData.tempCelsius} unitString="°C" precision={1} />

            <i class="unit-icon fas fa-tint"></i>
            <ValueWithUnit value={sensor.lastLogData.humidity} unitString="%" precision={0} />

            {#if sensor.lastLogData.pressurehPa}
                <i class="unit-icon fas fa-tachometer-alt"></i>
                <ValueWithUnit
                    value={sensor.lastLogData.pressurehPa}
                    unitString="hPa"
                    precision={0}
                />
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

    .sensor-data-records-container {
        display: grid;
        font-size: x-large;

        grid-template-columns: 2ch repeat(2, minmax(min-content, max-content));
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
