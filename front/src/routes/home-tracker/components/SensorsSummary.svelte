<script lang="ts">
    import type { RecordsBySensor, SensorRecord } from '$lib/HomeTracker/types';
    import {
        formatRecordTimestampToHuman,
        formatRecordTimestampToRelative
    } from '$lib/HomeTracker/utils';

    export let recordsBySensor: RecordsBySensor;

    const sensors = Object.keys(recordsBySensor).sort((a, b) =>
        a.toLowerCase() < b.toLowerCase() ? -1 : 1
    );
    const getLastRecord = (sensorRecords: SensorRecord[]) =>
        sensorRecords.sort((a, b) => a['@timestamp'] - b['@timestamp'])[sensorRecords.length - 1];
</script>

<div class="grid-container">
    <div class="header top sensor-name">Sensor</div>
    <div class="header top">Last update</div>
    <div class="header top">Temp (C)</div>
    <div class="header top">Humidity (%)</div>
    <div class="header top">Pressure (hPa)</div>
    <div class="header top">Int. Temp (C)</div>
    <div class="header top">Int. Humidity (%)</div>

    {#each sensors as sensor}
        {@const lastRecord = getLastRecord(recordsBySensor[sensor])}
        <div class="column sensor-name">
            <div class="header inline">Sensor</div>
            <div class="data">{sensor}</div>
        </div>
        <div class="column">
            <div class="header inline">Last update</div>
            <div class="data">
                {formatRecordTimestampToHuman(lastRecord['@timestamp'])}
                ({formatRecordTimestampToRelative(lastRecord['@timestamp'])})
            </div>
        </div>
        <div class="column">
            <div class="header inline">Temp (C)</div>
            <div class="data">
                {lastRecord.document.tempCelsius?.toFixed(2) || '-'}
            </div>
        </div>
        <div class="column">
            <div class="header inline">Humidity (%)</div>
            <div class="data">
                {lastRecord.document.humidity?.toFixed(2) || '-'}
            </div>
        </div>
        <div class="column">
            <div class="header inline">Pressure (hPa)</div>
            <div class="data">
                {lastRecord.document.pressurehPa?.toFixed(0) || '-'}
            </div>
        </div>
        <div class="column">
            <div class="header inline">Int. Temp (C)</div>
            <div class="data">
                {lastRecord.document.internalTempCelsius?.toFixed(2) || '-'}
            </div>
        </div>
        <div class="column">
            <div class="header inline">Int. Humidity (%)</div>
            <div class="data">
                {lastRecord.document.internalHumidity?.toFixed(2) || '-'}
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
