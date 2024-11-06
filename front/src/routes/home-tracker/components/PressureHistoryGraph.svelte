<script lang="ts">
    import { Bar } from 'svelte-chartjs';
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale
    } from 'chart.js';
    import type { PressureHistoryItem } from '$lib/HomeTracker';
    import { DateTime } from 'luxon';

    export let pressureHistory: PressureHistoryItem[];

    Chart.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

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
</script>

<div>
    <Bar
        {data}
        options={{
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
        }}
    />
</div>

<style>
    div {
        max-height: 300px;
    }
</style>
