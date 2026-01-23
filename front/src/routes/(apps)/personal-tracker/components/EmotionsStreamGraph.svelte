<script lang="ts">
    import type { PersonalTrackerEvent } from '$lib/PersonalTracker';
    import { DateTime } from 'luxon';

    interface Props {
        events: PersonalTrackerEvent[];
        hoveredTimestamp: number | null;
        onHoverChange: (timestamp: number | null) => void;
    }

    let { events, hoveredTimestamp, onHoverChange }: Props = $props();

    // Chart dimensions - responsive
    let containerWidth = $state(600);
    const height = 350;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
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

    // Aggregate data by week
    interface WeekData {
        weekStart: DateTime;
        weekStartUnix: number;
        counts: Map<string, number>;
        total: number;
    }

    let weeklyData = $derived.by(() => {
        if (sortedEvents.length === 0) return [];

        const weeks = new Map<string, WeekData>();

        for (const event of sortedEvents) {
            const date = DateTime.fromSeconds(event.eventDateUnix);
            const weekStart = date.startOf('week');
            const weekKey = weekStart.toISO()!;

            if (!weeks.has(weekKey)) {
                weeks.set(weekKey, {
                    weekStart,
                    weekStartUnix: weekStart.toSeconds(),
                    counts: new Map(categories.map((c) => [c, 0])),
                    total: 0
                });
            }

            const week = weeks.get(weekKey)!;
            if (event.emotionwheel?.emotions) {
                for (const emotion of event.emotionwheel.emotions) {
                    const current = week.counts.get(emotion.category) || 0;
                    week.counts.set(emotion.category, current + 1);
                    week.total++;
                }
            }
        }

        return Array.from(weeks.values()).sort((a, b) => a.weekStartUnix - b.weekStartUnix);
    });

    // X scale based on weeks
    let xScale = $derived.by(() => {
        if (weeklyData.length === 0) return () => 0;
        const minDate = weeklyData[0].weekStartUnix;
        const maxDate = weeklyData[weeklyData.length - 1].weekStartUnix;
        const range = maxDate - minDate || 1;
        return (timestamp: number) => ((timestamp - minDate) / range) * chartWidth;
    });

    // Calculate stream layers (centered stacking)
    interface StreamLayer {
        category: string;
        color: string;
        points: { x: number; y0: number; y1: number }[];
    }

    let streamLayers = $derived.by(() => {
        if (weeklyData.length === 0 || categories.length === 0) return [];

        // Find max total for scaling
        const maxTotal = Math.max(...weeklyData.map((w) => w.total), 1);

        // Calculate layers for each category
        const layers: StreamLayer[] = categories.map((category) => ({
            category,
            color: categoryColors.get(category) || '#888',
            points: []
        }));

        for (const week of weeklyData) {
            const x = xScale(week.weekStartUnix);

            // Calculate heights for each category (as proportion of chart height)
            const heights = categories.map((cat) => {
                const count = week.counts.get(cat) || 0;
                return (count / maxTotal) * chartHeight * 0.8; // 80% of chart height max
            });

            const totalHeight = heights.reduce((sum, h) => sum + h, 0);

            // Center the stack
            let y0 = (chartHeight - totalHeight) / 2;

            for (let i = 0; i < categories.length; i++) {
                const y1 = y0 + heights[i];
                layers[i].points.push({ x, y0, y1 });
                y0 = y1;
            }
        }

        return layers;
    });

    // Generate smooth path for a layer
    const generateStreamPath = (points: { x: number; y0: number; y1: number }[]) => {
        if (points.length === 0) return '';
        if (points.length === 1) {
            // Single point - draw a small rectangle
            const p = points[0];
            return `M ${p.x - 5} ${p.y0} L ${p.x + 5} ${p.y0} L ${p.x + 5} ${p.y1} L ${p.x - 5} ${p.y1} Z`;
        }

        // Top edge (left to right)
        let path = `M ${points[0].x} ${points[0].y0}`;

        // Use curve for smoother appearance
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx = (prev.x + curr.x) / 2;
            path += ` C ${cpx} ${prev.y0}, ${cpx} ${curr.y0}, ${curr.x} ${curr.y0}`;
        }

        // Bottom edge (right to left)
        for (let i = points.length - 1; i >= 0; i--) {
            const curr = points[i];
            if (i === points.length - 1) {
                path += ` L ${curr.x} ${curr.y1}`;
            } else {
                const next = points[i + 1];
                const cpx = (curr.x + next.x) / 2;
                path += ` C ${cpx} ${next.y1}, ${cpx} ${curr.y1}, ${curr.x} ${curr.y1}`;
            }
        }

        path += ' Z';
        return path;
    };

    // Monday vertical lines
    let mondayLines = $derived.by(() => {
        if (dailyData.length === 0) return [];

        const minDate = dailyData[0].dateUnix;
        const maxDate = dailyData[dailyData.length - 1].dateUnix;

        // Find the first Monday on or after minDate
        let current = DateTime.fromSeconds(minDate).startOf('day');
        const daysUntilMonday = (8 - current.weekday) % 7;
        current = current.plus({
            days: daysUntilMonday === 0 && current.weekday !== 1 ? 7 : daysUntilMonday
        });

        const mondays: { x: number; label: string }[] = [];
        const endDate = DateTime.fromSeconds(maxDate);

        while (current <= endDate) {
            const timestamp = current.toSeconds();
            mondays.push({
                x: xScale(timestamp),
                label: current.toFormat('dd/MM')
            });
            current = current.plus({ weeks: 1 });
        }

        return mondays;
    });

    // X-axis ticks
    let xTicks = $derived.by(() => {
        if (weeklyData.length === 0) return [];

        const maxTicks = 8;
        const ticks: { x: number; label: string }[] = [];

        if (weeklyData.length <= maxTicks) {
            for (const week of weeklyData) {
                ticks.push({
                    x: xScale(week.weekStartUnix),
                    label: week.weekStart.toFormat('dd/MM')
                });
            }
        } else {
            const step = Math.ceil(weeklyData.length / maxTicks);
            for (let i = 0; i < weeklyData.length; i += step) {
                const week = weeklyData[i];
                ticks.push({
                    x: xScale(week.weekStartUnix),
                    label: week.weekStart.toFormat('dd/MM')
                });
            }
        }

        return ticks;
    });

    // Hover state - using shared timestamp
    const handleMouseMove = (e: MouseEvent) => {
        if (dailyData.length === 0) return;

        const svg = e.currentTarget as SVGSVGElement;
        const rect = svg.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * width;
        const chartX = svgX - padding.left;

        if (chartX >= 0 && chartX <= chartWidth) {
            // Convert x position back to timestamp
            const minDate = dailyData[0].dateUnix;
            const maxDate = dailyData[dailyData.length - 1].dateUnix;
            const range = maxDate - minDate || 1;
            const timestamp = minDate + (chartX / chartWidth) * range;
            onHoverChange(timestamp);
        } else {
            onHoverChange(null);
        }
    };

    const handleMouseLeave = () => {
        onHoverChange(null);
    };

    // Computed hover position from shared timestamp
    let hoverX = $derived.by(() => {
        if (hoveredTimestamp === null || dailyData.length === 0) return null;
        const minDate = dailyData[0].dateUnix;
        const maxDate = dailyData[dailyData.length - 1].dateUnix;
        if (hoveredTimestamp < minDate || hoveredTimestamp > maxDate) return null;
        return xScale(hoveredTimestamp);
    });

    let hoveredWeek = $derived.by(() => {
        if (hoveredTimestamp === null || weeklyData.length === 0) return null;

        // Find closest week
        let closestWeek = weeklyData[0];
        let closestDist = Math.abs(closestWeek.weekStartUnix - hoveredTimestamp);

        for (const week of weeklyData) {
            const dist = Math.abs(week.weekStartUnix - hoveredTimestamp);
            if (dist < closestDist) {
                closestDist = dist;
                closestWeek = week;
            }
        }

        return closestWeek;
    });

    // Daily emotion counts for the overlay line (uses same xScale as stream)
    interface DayData {
        date: DateTime;
        dateUnix: number;
        count: number;
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
                    count: 0
                });
            }

            const day = days.get(dayKey)!;
            if (event.emotionwheel?.emotions) {
                day.count += event.emotionwheel.emotions.length;
            }
        }

        return Array.from(days.values()).sort((a, b) => a.dateUnix - b.dateUnix);
    });

    // Max daily count for scaling the line
    let maxDailyCount = $derived(Math.max(...dailyData.map((d) => d.count), 1));

    // Daily line points using the same xScale as stream
    let dailyLinePoints = $derived(
        dailyData.map((day) => ({
            x: xScale(day.dateUnix),
            y: chartHeight - (day.count / maxDailyCount) * chartHeight * 0.9,
            count: day.count,
            date: day.date
        }))
    );

    // Generate the daily count line path
    let dailyLinePath = $derived.by(() => {
        if (dailyLinePoints.length === 0) return '';

        if (dailyLinePoints.length === 1) {
            const p = dailyLinePoints[0];
            return `M ${p.x - 2} ${p.y} L ${p.x + 2} ${p.y}`;
        }

        // Smooth curve through points
        let path = `M ${dailyLinePoints[0].x} ${dailyLinePoints[0].y}`;
        for (let i = 1; i < dailyLinePoints.length; i++) {
            const prev = dailyLinePoints[i - 1];
            const curr = dailyLinePoints[i];
            const cpx = (prev.x + curr.x) / 2;
            path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
        }

        return path;
    });

    // Legend data sorted by total count
    let legendData = $derived.by(() => {
        const totals = new Map<string, number>();
        for (const week of weeklyData) {
            for (const [cat, count] of week.counts) {
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

<div class="emotions-stream-graph">
    <h3>Emotions Trends</h3>

    {#if weeklyData.length === 0}
        <p class="no-data">No emotions recorded in this time period</p>
    {:else}
        <div class="chart-container" bind:clientWidth={containerWidth}>
            <svg
                viewBox="0 0 {width} {height}"
                class="stream-chart"
                onmousemove={handleMouseMove}
                onmouseleave={handleMouseLeave}
            >
                <!-- Monday vertical lines -->
                <g class="monday-lines">
                    {#each mondayLines as monday}
                        <line
                            x1={padding.left + monday.x}
                            y1={padding.top}
                            x2={padding.left + monday.x}
                            y2={padding.top + chartHeight}
                            class="monday-line"
                        />
                    {/each}
                </g>

                <!-- Stream layers -->
                <g transform="translate({padding.left}, {padding.top})">
                    {#each streamLayers as layer}
                        <path
                            d={generateStreamPath(layer.points)}
                            fill={layer.color}
                            class="stream-layer"
                            opacity="0.85"
                        >
                            <title>{layer.category}</title>
                        </path>
                    {/each}

                    <!-- Daily count line overlay -->
                    {#if dailyLinePath}
                        <path d={dailyLinePath} class="daily-line" />
                        {#each dailyLinePoints as point}
                            <circle cx={point.x} cy={point.y} r="3" class="daily-point">
                                <title>{point.date.toFormat('dd MMM')}: {point.count} emotions</title>
                            </circle>
                        {/each}
                    {/if}
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

                <!-- Hover line and tooltip -->
                {#if hoverX !== null}
                    <line
                        x1={padding.left + hoverX}
                        y1={padding.top}
                        x2={padding.left + hoverX}
                        y2={padding.top + chartHeight}
                        class="hover-line"
                    />
                    {#if hoveredTimestamp}
                        <g
                            class="tooltip"
                            transform="translate({padding.left + hoverX}, {padding.top - 5})"
                        >
                            <text x="0" y="0" text-anchor="middle" class="tooltip-date">
                                {DateTime.fromSeconds(hoveredTimestamp).toFormat('dd/MM')}
                            </text>
                        </g>
                    {/if}
                {/if}
            </svg>

            <div class="legend">
                <div class="legend-item">
                    <span class="legend-line-icon"></span>
                    <span class="legend-label">Daily count</span>
                </div>
                {#each legendData as item}
                    <div class="legend-item">
                        <span class="legend-color" style="background-color: {item.color}"></span>
                        <span class="legend-label">{item.category}</span>
                        {#if hoveredWeek}
                            <span class="legend-count">{hoveredWeek.counts.get(item.category) || 0}</span>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .emotions-stream-graph {
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

    .stream-chart {
        width: 100%;
        min-width: 450px;
        max-height: 400px;
        height: auto;
        background: var(--nc-bg-2);
        border-radius: 8px;
    }

    .monday-line {
        stroke: var(--nc-tx-2);
        stroke-width: 1.5;
        opacity: 0.5;
    }

    .stream-layer {
        transition: opacity 0.2s;

        &:hover {
            opacity: 1 !important;
        }
    }

    .daily-line {
        fill: none;
        stroke: var(--nc-tx-1);
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.7;
    }

    .daily-point {
        fill: var(--nc-bg-1);
        stroke: var(--nc-tx-1);
        stroke-width: 1.5;
        opacity: 0.8;
        cursor: pointer;
        transition: r 0.15s ease;

        &:hover {
            r: 5;
            opacity: 1;
        }
    }

    .axis-label {
        font-size: 11px;
        fill: var(--nc-tx-2);
    }

    .hover-line {
        stroke: var(--nc-tx-2);
        stroke-width: 1;
        stroke-dasharray: 2 2;
    }

    .tooltip-date {
        font-size: 11px;
        fill: var(--nc-tx-1);
        font-weight: 500;
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

    .legend-line-icon {
        width: 20px;
        height: 3px;
        background: var(--nc-tx-1);
        border-radius: 2px;
        opacity: 0.7;
    }

    .legend-label {
        color: var(--nc-tx-1);
    }

    .legend-count {
        color: var(--nc-tx-2);
        font-size: 0.8rem;
    }
</style>
