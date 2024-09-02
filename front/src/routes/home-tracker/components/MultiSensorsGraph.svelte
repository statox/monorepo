<script lang="ts">
    import { DateTime } from 'luxon';
    import { Line } from 'svelte-chartjs';
    import type { SensorRecord } from '$lib/HomeTracker/types';
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
    import type { RecordsBySensor, SensorRecord } from '$lib/HomeTracker/types';

    ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale);

    const formatTimestampToHuman = (ts: number) => {
        const time = DateTime.fromMillis(ts);
        if (time.diffNow('hours').hours < 12) {
            return DateTime.fromMillis(ts).toFormat('HH:mm');
        } else {
            return DateTime.fromMillis(ts).toFormat('dd/MM HH:mm');
        }
    };

    export let recordsBySensor: RecordsBySensor;
    export let metric: 'temperature' | 'humidity' | 'pressure';

    const allDates = Object.keys(recordsBySensor)
        .reduce((allTimes, sensor) => {
            const sensorRecords = recordsBySensor[sensor];
            const sensorTimes = sensorRecords.map((r: SensorRecord) => r['@timestamp']);
            return allTimes.concat(sensorTimes);
        }, [])
        .sort((a, b) => a - b)
        .map((ts) => formatTimestampToHuman(ts));

    const indexColors = [
        [205, 130, 158],
        [130, 205, 158],
        [130, 158, 205]
    ];

    const getColorString = (color: number[], internalData: boolean) => {
        return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${internalData ? '0.3' : '1'})`;
    };

    const datasets = Object.keys(recordsBySensor).reduce((datasets, sensor, index) => {
        const sensorRecords = recordsBySensor[sensor];
        const data = sensorRecords.map((record: SensorRecord) => {
            let recordMetric: number | undefined;
            if (metric === 'temperature') {
                recordMetric = record.document.tempCelsius;
            } else if (metric === 'humidity') {
                recordMetric = record.document.humidity;
            } else {
                recordMetric = record.document.pressurehPa;
            }
            return {
                x: formatTimestampToHuman(record['@timestamp']),
                y: recordMetric
            };
        });

        const commonGraphSettings = {
            fill: true,
            lineTension: 0.3,
            backgroundColor: 'rgba(225, 204, 230, .3)',
            borderCapStyle: 'butt' as const,
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter' as const,
            pointBackgroundColor: 'rgb(255, 255, 255)',
            pointBorderWidth: 5,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgb(0, 0, 0)',
            pointHoverBorderColor: 'rgba(220, 220, 220, 1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10
        };

        // @ts-expect-error TODO Fix that
        datasets.push({
            label: sensor,
            data,
            borderColor: getColorString(indexColors[index], false),
            pointBorderColor: getColorString(indexColors[index], false),
            ...commonGraphSettings
        });

        if (metric === 'temperature' && sensorRecords[0].document.internalTempCelsius) {
            const internalData = sensorRecords.map((record: SensorRecord) => {
                return {
                    x: formatTimestampToHuman(record['@timestamp']),
                    y: record.document.internalTempCelsius
                };
            });

            // @ts-expect-error TODO Fix that
            datasets.push({
                label: sensor + ' (int)',
                data: internalData,
                borderColor: getColorString(indexColors[index], true),
                pointBorderColor: getColorString(indexColors[index], true),
                ...commonGraphSettings
            });
        }
        if (metric === 'humidity' && sensorRecords[0].document.internalHumidity) {
            const internalData = sensorRecords.map((record: SensorRecord) => {
                return {
                    x: formatTimestampToHuman(record['@timestamp']),
                    y: record.document.internalHumidity
                };
            });

            // @ts-expect-error TODO Fix that
            datasets.push({
                label: sensor + ' (int)',
                data: internalData,
                borderColor: getColorString(indexColors[index], true),
                pointBorderColor: getColorString(indexColors[index], true),
                ...commonGraphSettings
            });
        }

        return datasets;
    }, []);

    const dataTemp = {
        labels: allDates,
        datasets
    };
</script>

<h3>{metric}</h3>
<div>
    <Line data={dataTemp} height={300} options={{ responsive: true, maintainAspectRatio: false }} />
</div>
