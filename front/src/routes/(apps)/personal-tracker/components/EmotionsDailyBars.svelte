<script lang="ts">
    import type { PersonalTrackerEvent } from '$lib/PersonalTracker';
    import { DateTime } from 'luxon';

    interface Props {
        events: PersonalTrackerEvent[];
    }

    let { events }: Props = $props();

    // Chart dimensions - responsive
    let containerWidth = $state(600);
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 50, left: 40 };
    let width = $derived(Math.max(containerWidth, 450));
    let chartWidth = $derived(width - padding.left - padding.right);
    const chartHeight = height - padding.top - padding.bottom;

    // Sort events by date
    let sortedEvents = $derived(
        [...events]
            .filter((e) => e.emotionwheel?.emotions?.length)
            .sort((a, b) => a.eventDateUnix - b.eventDateUnix)
    );

    // Get unique categories and assign colors
    let categoryColors = $derived.by(() => {
        const colors = new Map<string, string>();
        for (const event of sortedEvents) {
            if (event.emotionwheel?.emotions) {
                for (const emotion of event.emotionwheel.emotions) {
                    if (!colors.has(emotion.category)) {
                        colors.set(emotion.category, emotion.color);
                    }
                }
            }
        }
        return colors;
    });

    let categories = $derived(Array.from(categoryColors.keys()).sort());

    // Aggregate data by day
    interface DayData {
        date: DateTime;
        dateUnix: number;
        counts: Map<string, number>;
        total: number;
    }

    let dailyData = $derived.by(() => {
        if (sortedEvents.length === 0) return [];

        const days = new Map<string, DayData>();

        for (const event of sortedEvents) {
            const date = DateTime.fromSeconds(event.eventDateUnix).startOf('day');
            const dayKey = date.toISO()!;

            if (!days.has(dayKey)) {
                days.set(dayKey, {
                    date,
                    dateUnix: date.toSeconds(),
                    counts: new Map(),
                    total: 0
                });
            }

            const day = days.get(dayKey)!;
            if (event.emotionwheel?.emotions) {
                for (const emotion of event.emotionwheel.emotions) {
                    const current = day.counts.get(emotion.category) || 0;
                    day.counts.set(emotion.category, current + 1);
                    day.total++;
                }
            }
        }

        return Array.from(days.values()).sort((a, b) => a.dateUnix - b.dateUnix);
    });

    // Max count for scaling
    let maxCount = $derived.by(() => {
        let max = 1;
        for (const day of dailyData) {
            for (const count of day.counts.values()) {
                if (count > max) max = count;
            }
        }
        return max;
    });

    // X scale based on timestamps (matches stream graph)
    let xScale = $derived.by(() => {
        if (dailyData.length === 0) return () => 0;
        const minDate = dailyData[0].dateUnix;
        const maxDate = dailyData[dailyData.length - 1].dateUnix;
        const range = maxDate - minDate || 1;
        return (timestamp: number) => ((timestamp - minDate) / range) * chartWidth;
    });

    // Calculate bar width based on minimum gap between consecutive days
    let barWidth = $derived.by(() => {
        if (dailyData.length === 0) return 20;
        if (dailyData.length === 1) return Math.min(20, chartWidth * 0.8 / Math.max(categories.length, 1));

        // Find minimum pixel gap between consecutive days
        let minGap = Infinity;
        for (let i = 1; i < dailyData.length; i++) {
            const gap = xScale(dailyData[i].dateUnix) - xScale(dailyData[i - 1].dateUnix);
            if (gap < minGap) minGap = gap;
        }

        // Group width should be 80% of minimum gap to leave some spacing
        const maxGroupWidth = minGap * 0.8;
        const singleBarWidth = maxGroupWidth / Math.max(categories.length, 1);

        return Math.max(3, Math.min(20, singleBarWidth));
    });

    let groupWidth = $derived(barWidth * categories.length);

    // Y scale
    let yScale = $derived.by(() => {
        return (value: number) => chartHeight - (value / maxCount) * chartHeight * 0.9;
    });

    // Generate bars for each day
    interface Bar {
        x: number;
        y: number;
        width: number;
        height: number;
        color: string;
        category: string;
        count: number;
        date: DateTime;
    }

    let bars = $derived.by(() => {
        const result: Bar[] = [];

        dailyData.forEach((day) => {
            const dayX = xScale(day.dateUnix);
            const startX = dayX - groupWidth / 2;

            categories.forEach((category, catIndex) => {
                const count = day.counts.get(category) || 0;
                if (count > 0) {
                    const barX = startX + catIndex * barWidth;
                    const barHeight = (count / maxCount) * chartHeight * 0.9;

                    result.push({
                        x: barX,
                        y: chartHeight - barHeight,
                        width: barWidth - 1,
                        height: barHeight,
                        color: categoryColors.get(category) || '#888',
                        category,
                        count,
                        date: day.date
                    });
                }
            });
        });

        return result;
    });

    // X-axis ticks
    let xTicks = $derived.by(() => {
        if (dailyData.length === 0) return [];

        const maxTicks = 10;
        const ticks: { x: number; label: string }[] = [];

        if (dailyData.length <= maxTicks) {
            dailyData.forEach((day) => {
                ticks.push({
                    x: xScale(day.dateUnix),
                    label: day.date.toFormat('dd/MM')
                });
            });
        } else {
            const step = Math.ceil(dailyData.length / maxTicks);
            for (let i = 0; i < dailyData.length; i += step) {
                const day = dailyData[i];
                ticks.push({
                    x: xScale(day.dateUnix),
                    label: day.date.toFormat('dd/MM')
                });
            }
        }

        return ticks;
    });

    // Y-axis ticks
    let yTicks = $derived.by(() => {
        const ticks: number[] = [];
        const step = Math.max(1, Math.ceil(maxCount / 5));
        for (let i = 0; i <= maxCount; i += step) {
            ticks.push(i);
        }
        if (ticks[ticks.length - 1] < maxCount) {
            ticks.push(maxCount);
        }
        return ticks;
    });

    // Legend data sorted by total count
    let legendData = $derived.by(() => {
        const totals = new Map<string, number>();
        for (const day of dailyData) {
            for (const [cat, count] of day.counts) {
                totals.set(cat, (totals.get(cat) || 0) + count);
            }
        }
        return categories
            .map((cat) => ({
                category: cat,
                color: categoryColors.get(cat) || '#888',
                total: totals.get(cat) || 0
            }))
            .sort((a, b) => b.total - a.total);
    });
</script>

<div class="emotions-daily-bars">
    <h3>Daily Emotions by Category</h3>

    {#if dailyData.length === 0}
        <p class="no-data">No emotions recorded in this time period</p>
    {:else}
        <div class="chart-container" bind:clientWidth={containerWidth}>
            <svg viewBox="0 0 {width} {height}" class="bar-chart">
                <!-- Grid lines -->
                <g class="grid">
                    {#each yTicks as tick}
                        <line
                            x1={padding.left}
                            y1={padding.top + yScale(tick)}
                            x2={width - padding.right}
                            y2={padding.top + yScale(tick)}
                            class="grid-line"
                        />
                    {/each}
                </g>

                <!-- Bars -->
                <g transform="translate({padding.left}, {padding.top})">
                    {#each bars as bar}
                        <rect
                            x={bar.x}
                            y={bar.y}
                            width={bar.width}
                            height={bar.height}
                            fill={bar.color}
                            class="bar"
                        >
                            <title
                                >{bar.date.toFormat('dd MMM')}: {bar.category} - {bar.count}</title
                            >
                        </rect>
                    {/each}
                </g>

                <!-- Y-axis -->
                <g class="y-axis">
                    {#each yTicks as tick}
                        <text
                            x={padding.left - 8}
                            y={padding.top + yScale(tick) + 4}
                            class="axis-label"
                            text-anchor="end"
                        >
                            {tick}
                        </text>
                    {/each}
                </g>

                <!-- X-axis -->
                <g class="x-axis">
                    {#each xTicks as tick}
                        <text
                            x={padding.left + tick.x}
                            y={height - padding.bottom + 20}
                            class="axis-label"
                            text-anchor="middle"
                        >
                            {tick.label}
                        </text>
                    {/each}
                </g>
            </svg>

            <div class="legend">
                {#each legendData as item}
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: {item.color}"></span>
                        <span class="legend-label">{item.category}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .emotions-daily-bars {
        margin-top: 1.5rem;

        h3 {
            margin-bottom: 1rem;
        }
    }

    .no-data {
        color: var(--nc-tx-2);
        font-style: italic;
    }

    .chart-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .bar-chart {
        width: 100%;
        min-width: 450px;
        max-height: 350px;
        height: auto;
        background: var(--nc-bg-2);
        border-radius: 8px;
    }

    .grid-line {
        stroke: var(--nc-bg-3);
        stroke-width: 1;
        stroke-dasharray: 4 4;
    }

    .bar {
        transition: opacity 0.15s ease;

        &:hover {
            opacity: 0.8;
        }
    }

    .axis-label {
        font-size: 11px;
        fill: var(--nc-tx-2);
    }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.875rem;
    }

    .legend-color {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        flex-shrink: 0;
    }

    .legend-label {
        color: var(--nc-tx-1);
    }
</style>
