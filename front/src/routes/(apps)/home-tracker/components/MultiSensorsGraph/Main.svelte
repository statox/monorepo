<script lang="ts">
    import {
        CategoryScale,
        Chart,
        Legend,
        LineController,
        LineElement,
        LinearScale,
        PointElement,
        Title,
        Tooltip,
        type ChartConfiguration
    } from 'chart.js';
    import {
        formatRecordTimestampToHuman,
        type HomeTrackerHistogramData,
        type HomeTrackerTimeData,
        type SensorMetadata
    } from '$lib/HomeTracker';
    import type { GraphType } from './types';
    import { onMount } from 'svelte';

    Chart.register(
        CategoryScale,
        Legend,
        LineController,
        LineElement,
        LinearScale,
        PointElement,
        Title,
        Tooltip
    );

    interface Props {
        sensorsData: SensorMetadata[];
        sensorNames: string[];
        histogramData: HomeTrackerHistogramData;
        graphType: GraphType;
    }

    let { sensorsData, sensorNames, histogramData, graphType }: Props = $props();

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
    const { graphName, metricUnitSymbol, metricProperty } = $derived(graphsProperties[graphType]);

    const allDates = $derived(Object.keys(histogramData).sort((a, b) => Number(a) - Number(b)));

    type AlphaMode = 'dark' | 'normal' | 'light';
    const getColorString = (sensorName: string, alphaMode: AlphaMode) => {
        const alphaConfig: Record<AlphaMode, string> = {
            dark: '4D',
            normal: '80',
            light: 'B3'
        };

        const color =
            sensorsData.find((sensor) => sensor.sensorName === sensorName)?.hexColor || '#141414';

        const alpha = alphaConfig[alphaMode];
        return color + alpha;
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

    const datasets = $derived(
        sensorNames.reduce((datasets, sensor) => {
            const sensorMetadata = sensorsData.find(
                (sensorData) => sensorData.sensorName === sensor
            );
            const offset = metricProperty === 'tempCelsius' ? (sensorMetadata?.tempOffset ?? 0) : 0;

            const data = Object.keys(histogramData)
                .filter((ts) => {
                    const key = ts as unknown as keyof HomeTrackerHistogramData;
                    return histogramData[key]?.[metricProperty]?.[sensor];
                })
                .map((ts) => {
                    const key = ts as unknown as keyof HomeTrackerHistogramData;
                    return {
                        x: ts,
                        y: (histogramData[key]?.[metricProperty]?.[sensor] || 0) + offset
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
        }, [])
    );

    const dataTemp = $derived({
        labels: allDates,
        datasets
    });

    const hoverLinePlugin = {
        // LLM Generated. ChartJS plugin to display a white vertical line over the mouse position
        // (Draw the line only when hovering a data point)
        id: 'hoverLine',
        afterDraw(chart: Chart) {
            // @ts-expect-error TODO Check typing error
            if (chart.tooltip?._active && chart.tooltip._active.length > 0) {
                const ctx = chart.ctx;
                // @ts-expect-error TODO Check typing error
                const activePoint = chart.tooltip._active[0];
                const x = activePoint.element.x;
                const topY = chart.chartArea.top;
                const bottomY = chart.chartArea.bottom;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'white';
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    const config: ChartConfiguration = $derived({
        type: 'line',
        data: dataTemp,
        options: {
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
        },
        plugins: [hoverLinePlugin]
    });

    let chartElement: HTMLCanvasElement | undefined = $state();
    onMount(() => {
        if (chartElement === undefined) {
            throw new Error('Missing canvas element to draw in');
        }
        const ctx = chartElement.getContext('2d');
        if (ctx === null) {
            throw new Error('Missing ctx element to draw in');
        }
        new Chart(ctx, config);
    });
</script>

<h2>{graphName} ({metricUnitSymbol})</h2>

<canvas class="graph-canvas" bind:this={chartElement}></canvas>

<style>
    .graph-canvas {
        max-height: 300px;
    }
</style>
