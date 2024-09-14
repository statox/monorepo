<script lang="ts">
    import type { SensorState } from '$lib/HomeTracker/types';
    import {
        formatRecordTimestampToHuman,
        formatRecordTimestampToRelative
    } from '$lib/HomeTracker/utils';

    export let sensorsData: SensorState[];
</script>

<div class="grid-container">
    <div class="header top sensor-name">Sensor</div>
    <div class="header top">Last update</div>
    <div class="header top">Temp (C)</div>
    <div class="header top">Humidity (%)</div>
    <div class="header top">Pressure (hPa)</div>
    <div class="header top">Int. Temp (C)</div>
    <div class="header top">Int. Humidity (%)</div>

    {#each sensorsData.sort( (a, b) => (a.sensorName.toLowerCase() < b.sensorName.toLowerCase() ? -1 : 1) ) as sensor}
        <div class="column sensor-name">
            <div class="header inline">Sensor</div>
            <div
                class="data"
                style={`color: rgb(${sensor.rgbColor.r}, ${sensor.rgbColor.g}, ${sensor.rgbColor.b})`}
            >
                {sensor.sensorName}
            </div>
        </div>
        <div class="column">
            <div class="header inline">Last update</div>
            <div class="data">
                {formatRecordTimestampToHuman(sensor.lastLogTimestamp)}
                ({formatRecordTimestampToRelative(sensor.lastLogTimestamp)})
            </div>
        </div>
        <div class="column">
            <div class="header inline">Temp (C)</div>
            <div class="data">
                {sensor.lastLogData.tempCelsius?.toFixed(2) || '-'}
            </div>
        </div>
        <div class="column">
            <div class="header inline">Humidity (%)</div>
            <div class="data">
                {sensor.lastLogData.humidity?.toFixed(2) || '-'}
            </div>
        </div>
        <div class="column">
            <div class="header inline">Pressure (hPa)</div>
            <div class="data">
                {sensor.lastLogData.pressurehPa?.toFixed(0) || '-'}
            </div>
        </div>
        <div class="column">
            <div class="header inline">Int. Temp (C)</div>
            <div class="data">
                {sensor.lastLogData.internalTempCelsius?.toFixed(2) || '-'}
            </div>
        </div>
        <div class="column">
            <div class="header inline">Int. Humidity (%)</div>
            <div class="data">
                {sensor.lastLogData.internalHumidity?.toFixed(2) || '-'}
            </div>
        </div>
    {/each}
</div>

<style>
    .grid-container {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        column-gap: 20px;
    }

    .sensor-name {
        background: var(--nc-bg-2);
    }

    .header {
        font-weight: bolder;
    }

    .header.inline {
        display: none;
    }

    .column {
        display: block;
    }

    @media (max-width: 768px) {
        .grid-container {
            grid-template-columns: 1fr;
        }
        .header.top {
            display: none;
        }
        .header.inline {
            display: block;
        }

        .column {
            display: flex;
            justify-content: space-between;
        }
    }
</style>
