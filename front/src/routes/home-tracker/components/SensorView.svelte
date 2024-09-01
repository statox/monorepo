<script lang="ts">
    import type { SensorRecord } from '$lib/HomeTracker/types';
    import { DateTime } from 'luxon';

    export let sensorName: string;
    export let records: SensorRecord[];

    const lastRecord = records.sort((a, b) => b['@timestamp'] - a['@timestamp'])[0];

    const formatTimestamp = (ts: number) => {
        return DateTime.fromMillis(ts).toRelative();
    };
</script>

<div class="container">
    <h3>{sensorName}</h3>

    <p>Last update {formatTimestamp(lastRecord['@timestamp'])}</p>
    <p>Temp: {lastRecord.document.tempCelsius?.toFixed(2)} C</p>
    <p>Humidity: {lastRecord.document.humidity?.toFixed(2)} %</p>

    {#if lastRecord.document.pressurehPa}
        <p>Presure: {lastRecord.document.pressurehPa.toFixed(0)} hPa</p>
    {/if}
    {#if lastRecord.document.internalTempCelsius}
        <p>Internal Temp: {lastRecord.document.internalTempCelsius.toFixed(2)} C</p>
    {/if}
    {#if lastRecord.document.internalHumidity}
        <p>Internal Humidity: {lastRecord.document.internalHumidity.toFixed(2)} %</p>
    {/if}

    <!-- {#each records as record} -->
    <!--     <p>{JSON.stringify(record)}</p> -->
    <!-- {/each} -->
</div>
