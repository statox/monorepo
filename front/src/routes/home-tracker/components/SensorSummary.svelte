<script lang="ts">
    import { ValueWithUnit } from '$lib/components/ValueWithUnit';
    import { formatRecordTimestampToRelative } from '$lib/HomeTracker';
    import type { SensorState } from '$lib/HomeTracker/types';

    export let sensor: SensorState;

    const color = `rgb(${sensor.rgbColor.r}, ${sensor.rgbColor.g}, ${sensor.rgbColor.b})`;

    let formatedLastLogTimestamp: string | null = 'NA';

    formatedLastLogTimestamp =
        formatRecordTimestampToRelative(sensor.lastLogTimestamp) ||
        '(error getting last timestamp)';
</script>

<div class="container" style="--sensor-color: {color}">
    <img
        class="sensor-icon"
        src={sensor.iconPath}
        title="{sensor.sensorName} icon"
        alt="{sensor.sensorName} icon"
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

        <div class="sensor-data-records-container">
            <i class="unit-icon fas fa-thermometer-half"></i>
            <ValueWithUnit value={sensor.lastLogData.tempCelsius} unitString={'°C'} precision={1} />

            <i class="unit-icon fas fa-tint"></i>
            <ValueWithUnit value={sensor.lastLogData.humidity} unitString={'%'} precision={0} />

            {#if sensor.lastLogData.pressurehPa}
                <i class="unit-icon fas fa-tachometer-alt"></i>
                <ValueWithUnit
                    value={sensor.lastLogData.pressurehPa}
                    unitString={'hPa'}
                    precision={0}
                />
            {/if}
        </div>

        {#if sensor.lastLogData.internalTempCelsius || sensor.lastLogData.internalHumidity}
            <div class="sensor-data-records-container internal-data">
                <i class="unit-icon fas fa-thermometer-half"></i>
                <ValueWithUnit
                    value={sensor.lastLogData.internalTempCelsius}
                    unitString={'°C'}
                    precision={1}
                />

                <i class="unit-icon fas fa-tint"></i>
                <ValueWithUnit
                    value={sensor.lastLogData.internalHumidity}
                    unitString={'%'}
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
</style>
