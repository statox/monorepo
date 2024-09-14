<script lang="ts">
    import { Line } from 'svelte-chartjs';
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
    import type {
        HomeTrackerHistogramData,
        HomeTrackerTimeData,
        SensorState
    } from '$lib/HomeTracker/types';
    import { formatRecordTimestampToHuman } from '$lib/HomeTracker/utils';

    ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale);

    export let sensorsData: SensorState[];
    export let sensorNames: string[];
    export let histogramData: HomeTrackerHistogramData;
    export let metric: keyof HomeTrackerTimeData;

    const allDates = Object.keys(histogramData).sort((a, b) => Number(a) - Number(b));

    type AlphaMode = 'dark' | 'normal' | 'light';
    const getColorString = (sensorName: string, alphaMode: AlphaMode) => {
        const alphaConfig: Record<AlphaMode, number> = {
            dark: 0.3,
            normal: 0.5,
            light: 0.7
        };

        const color = sensorsData.find((sensor) => sensor.sensorName === sensorName)?.rgbColor || {
            r: 20,
            g: 20,
            b: 20
        };

        const alpha = alphaConfig[alphaMode];
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    };

    const commonGraphSettings = {
        lineTension: 0.3,
        backgroundColor: 'rgba(225, 204, 230, .3)',
        borderCapStyle: 'butt' as const,
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: 'miter' as const,
        pointBorderWidth: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgb(0, 0, 0)',
        pointHoverBorderColor: 'rgba(220, 220, 220, 1)',
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10
    };

    const datasets = sensorNames.reduce((datasets, sensor) => {
        const data = Object.keys(histogramData)
            .filter((ts) => {
                return histogramData[ts as unknown as keyof HomeTrackerHistogramData]?.[metric]?.[
                    sensor
                ];
            })
            .map((ts) => {
                return {
                    x: ts,
                    y: histogramData[ts as unknown as keyof HomeTrackerHistogramData][metric]?.[
                        sensor
                    ]
                };
            });

        if (data.length) {
            // @ts-expect-error TODO Fix that
            datasets.push({
                label: sensor,
                data,
                borderColor: getColorString(sensor, 'normal'),
                pointBorderColor: getColorString(sensor, 'normal'),
                pointBackgroundColor: getColorString(sensor, 'light'),
                ...commonGraphSettings
            });
        }

        if (['tempCelsius', 'humidity'].includes(metric as string)) {
            const internalMetric =
                metric === 'tempCelsius' ? 'internalTempCelsius' : 'internalHumidity';
            const data = Object.keys(histogramData)
                .filter((ts) => {
                    return histogramData[ts as unknown as keyof HomeTrackerHistogramData]?.[
                        internalMetric
                    ]?.[sensor];
                })
                .map((ts) => {
                    return {
                        x: ts,
                        y: histogramData[ts as unknown as keyof HomeTrackerHistogramData][
                            internalMetric
                        ]?.[sensor]
                    };
                });

            if (data.length) {
                // @ts-expect-error TODO Fix that
                datasets.push({
                    label: sensor + ' (int)',
                    data,
                    borderColor: getColorString(sensor, 'dark'),
                    pointBorderColor: getColorString(sensor, 'dark'),
                    pointBackgroundColor: getColorString(sensor, 'light'),
                    ...commonGraphSettings
                });
            }
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
    <Line
        data={dataTemp}
        height={300}
        options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        callback: (_value, index) =>
                            formatRecordTimestampToHuman(Number(allDates[index]))
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (context) => formatRecordTimestampToHuman(Number(context[0].label))
                    }
                }
            }
        }}
    />
</div>
