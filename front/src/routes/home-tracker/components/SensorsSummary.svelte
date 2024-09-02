<script lang="ts">
    import type { RecordsBySensor, SensorRecord } from '$lib/HomeTracker/types';
    import { DateTime } from 'luxon';

    export let recordsBySensor: RecordsBySensor;

    const sensors = Object.keys(recordsBySensor).sort((a, b) =>
        a.toLowerCase() < b.toLowerCase() ? -1 : 1
    );
    const getLastRecord = (sensorRecords: SensorRecord[]) =>
        sensorRecords.sort((a, b) => a['@timestamp'] - b['@timestamp'])[sensorRecords.length - 1];

    const formatTimestampToHuman = (ts: number) => {
        const time = DateTime.fromMillis(ts);
        if (time.diffNow('hours').hours < 12) {
            return DateTime.fromMillis(ts).toFormat('HH:mm');
        } else {
            return DateTime.fromMillis(ts).toFormat('dd/MM HH:mm');
        }
    };
    const formatTimestampToRelative = (ts: number) => {
        return DateTime.fromMillis(ts).toRelative();
    };
</script>

<div class="grid-container">
    <span>Sensor</span>
    <span>Last update</span>
    <span>Temp (C)</span>
    <span>Humidity (%)</span>
    <span>Pressure (hPa)</span>
    <span>Int. Temp (C)</span>
    <span>Int. Humidity (%)</span>

    {#each sensors as sensor}
        {@const lastRecord = getLastRecord(recordsBySensor[sensor])}
        <div>{sensor}</div>
        <div>
            {formatTimestampToHuman(lastRecord['@timestamp'])}
            ({formatTimestampToRelative(lastRecord['@timestamp'])})
        </div>
        <div>{lastRecord.document.tempCelsius?.toFixed(2) || '-'}</div>
        <div>{lastRecord.document.humidity?.toFixed(2) || '-'}</div>

        <div>{lastRecord.document.pressurehPa?.toFixed(0) || '-'}</div>
        <div>{lastRecord.document.internalTempCelsius?.toFixed(2) || '-'}</div>
        <div>{lastRecord.document.internalHumidity?.toFixed(2) || '-'}</div>
    {/each}
</div>

<style>
    .grid-container {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 20px;
    }

    @media (max-width: 768px) {
        .grid-container {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
    }

    @media (max-width: 480px) {
        .grid-container {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
    }
</style>
