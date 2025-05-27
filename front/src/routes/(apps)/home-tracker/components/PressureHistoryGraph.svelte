<script lang="ts">
    import type { PressureHistoryItem } from '$lib/HomeTracker';
    import {
        BarElement,
        BarController,
        CategoryScale,
        Chart,
        Legend,
        LinearScale,
        Title,
        Tooltip,
        type ChartConfiguration
    } from 'chart.js';

    import { DateTime } from 'luxon';
    import { onMount } from 'svelte';

    interface Props {
        pressureHistory: PressureHistoryItem[];
    }

    let { pressureHistory }: Props = $props();

    Chart.register(BarController, BarElement, CategoryScale, Legend, LinearScale, Title, Tooltip);

    const sortedPressureHistory = pressureHistory.sort((a, b) => a.timestamp - b.timestamp);
    const labels = sortedPressureHistory.map((i) => i.timestamp);
    const pressures = sortedPressureHistory.map((i) => i.averagePressurehPa);
    export const data = {
        labels: labels,
        datasets: [
            {
                label: 'pressure (hPa)',
                data: pressures,
                backgroundColor: 'rgba(98,  182, 239,0.4)',
                borderWidth: 1,
                borderColor: 'rgba(98,  182, 239, 1)',
                barPercentage: 1.0,
                categoryPercentage: 1.0
            }
        ]
    };

    const config: ChartConfiguration = {
        type: 'bar',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        callback: (_value, index) => {
                            const ts = Number(labels[index]);
                            const dt = DateTime.fromMillis(ts).toRelative();
                            return dt;
                        }
                    }
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    };

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

<canvas class="graph-canvas" bind:this={chartElement} width={400} height={400}></canvas>

<style>
    .graph-canvas {
        max-height: 150px;
    }
</style>
