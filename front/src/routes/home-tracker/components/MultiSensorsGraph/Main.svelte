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
    import type { GraphType } from './types';

    ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale);

    export let sensorsData: SensorState[];
    export let sensorNames: string[];
    export let histogramData: HomeTrackerHistogramData;
    export let graphType: GraphType;

    const graphsProperties: Record<
        GraphType,
        {
            graphName: string;
            metricUnitSymbol: string;
            metricProperty: keyof HomeTrackerTimeData;
        }
    > = {
        temperature: {
            graphName: 'Temperature',
            metricProperty: 'tempCelsius',
            metricUnitSymbol: 'C'
        },
        battery: { graphName: 'Battery', metricProperty: 'batteryCharge', metricUnitSymbol: 'V' },
        humidity: { graphName: 'Humidity', metricProperty: 'humidity', metricUnitSymbol: '%' },
        pressure: { graphName: 'Pressure', metricProperty: 'pressurehPa', metricUnitSymbol: 'hPa' },
        internalTemperature: {
            graphName: 'Internal Temperature',
            metricProperty: 'internalTempCelsius',
            metricUnitSymbol: 'C'
        },
        internalHumidity: {
            graphName: 'Internal Humidity',
            metricProperty: 'internalHumidity',
            metricUnitSymbol: '%'
        }
    };
    const { graphName, metricUnitSymbol, metricProperty } = graphsProperties[graphType];

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
                return histogramData[ts as unknown as keyof HomeTrackerHistogramData]?.[
                    metricProperty
                ]?.[sensor];
            })
            .map((ts) => {
                return {
                    x: ts,
                    y: histogramData[ts as unknown as keyof HomeTrackerHistogramData][
                        metricProperty
                    ]?.[sensor]
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

        return datasets;
    }, []);

    const dataTemp = {
        labels: allDates,
        datasets
    };
</script>

<h2>{graphName} ({metricUnitSymbol})</h2>
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
