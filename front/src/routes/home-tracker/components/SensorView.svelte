<script lang="ts">
    import { Line } from 'svelte-chartjs';
    import type { SensorRecord } from '$lib/HomeTracker/types';
    import { DateTime } from 'luxon';
    import {
        Chart as ChartJS,
        Title,
        Tooltip,
        Legend,
        LineElement,
        LinearScale,
        PointElement,
        CategoryScale
    } from 'chart.js';

    ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale);

    export let sensorName: string;
    export let records: SensorRecord[];

    const lastRecord = records.sort((a, b) => a['@timestamp'] - b['@timestamp'])[
        records.length - 1
    ];

    const formatTimestamp = (ts: number) => {
        return DateTime.fromMillis(ts).toRelative();
    };

    const dataTemp = {
        labels: records.map((r) => DateTime.fromMillis(r['@timestamp']).toFormat('HH:mm')),
        datasets: [
            {
                label: 'Temp (C)',
                fill: true,
                lineTension: 0.3,
                backgroundColor: 'rgba(225, 204, 230, .3)',
                borderColor: 'rgb(205, 130, 158)',
                borderCapStyle: 'butt' as const,
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter' as const,
                pointBorderColor: 'rgb(205, 130, 158)',
                pointBackgroundColor: 'rgb(255, 255, 255)',
                pointBorderWidth: 10,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgb(0, 0, 0)',
                pointHoverBorderColor: 'rgba(220, 220, 220, 1)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: records.map((r) => r.document.tempCelsius!)
            }
        ]
    };
    const dataHumidity = {
        labels: records.map((r) => DateTime.fromMillis(r['@timestamp']).toFormat('HH:mm')),
        datasets: [
            {
                label: 'Humidity',
                fill: true,
                lineTension: 0.3,
                backgroundColor: 'rgba(42, 163, 221, .3)',
                borderColor: 'rgb(42, 163, 221)',
                borderCapStyle: 'butt' as const,
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter' as const,
                pointBorderColor: 'rgb(35, 26, 136)',
                pointBackgroundColor: 'rgb(255, 255, 255)',
                pointBorderWidth: 10,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgb(0, 0, 0)',
                pointHoverBorderColor: 'rgba(220, 220, 220, 1)',
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                data: records.map((r) => r.document.humidity!)
            }
        ]
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

    <Line data={dataTemp} height={50} options={{ responsive: true }} />
    <Line data={dataHumidity} height={50} options={{ responsive: true }} />
</div>
