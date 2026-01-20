<script lang="ts">
    import type { PersonalTrackerEvent } from '$lib/PersonalTracker';
    import { DateTime } from 'luxon';

    interface Props {
        events: PersonalTrackerEvent[];
    }

    let { events }: Props = $props();

    // Labels for mood and energy values
    const moodLabels: Record<number, string> = {
        1: 'Terrible',
        2: 'Very Bad',
        3: 'Bad',
        4: 'Poor',
        5: 'Okay',
        6: 'Good',
        7: 'Great',
        8: 'Very Good',
        9: 'Excellent',
        10: 'Amazing'
    };

    const energyLabels: Record<number, string> = {
        1: 'Exhausted',
        2: 'Very Tired',
        3: 'Tired',
        4: 'Drained',
        5: 'Low',
        6: 'Moderate',
        7: 'Good',
        8: 'Energetic',
        9: 'Vibrant',
        10: 'Peak Energy'
    };

    // Chart dimensions - responsive
    let containerWidth = $state(600);
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    let width = $derived(Math.max(containerWidth, 450));
    let chartWidth = $derived(width - padding.left - padding.right);
    const chartHeight = height - padding.top - padding.bottom;

    // Sort events by date (ascending for the chart)
    let sortedEvents = $derived(
        [...events]
            .filter((e) => e.mood || e.energy)
            .sort((a, b) => a.eventDateUnix - b.eventDateUnix)
    );

    // Scale functions
    let minValue = $derived.by(() => {
        const values = sortedEvents.flatMap((e) => [e.mood, e.energy].filter((v) => v != null));
        return values.length > 0 ? Math.min(...values) : 1;
    });

    let maxValue = $derived.by(() => {
        const values = sortedEvents.flatMap((e) => [e.mood, e.energy].filter((v) => v != null));
        return values.length > 0 ? Math.max(...values) : 10;
    });

    let xScale = $derived.by(() => {
        if (sortedEvents.length === 0) return () => 0;
        const minDate = sortedEvents[0].eventDateUnix;
        const maxDate = sortedEvents[sortedEvents.length - 1].eventDateUnix;
        const range = maxDate - minDate || 1;
        return (timestamp: number) => ((timestamp - minDate) / range) * chartWidth;
    });

    let yScale = $derived.by(() => {
        const range = maxValue - minValue || 1;
        return (value: number) => chartHeight - ((value - minValue) / range) * chartHeight;
    });

    // Generate path for a line
    const generateLinePath = (data: { x: number; y: number }[]) => {
        if (data.length === 0) return '';
        return data.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    };

    let moodPoints = $derived(
        sortedEvents
            .filter((e) => e.mood !== undefined && e.mood !== null)
            .map((e) => ({
                x: xScale(e.eventDateUnix),
                y: yScale(e.mood!),
                value: e.mood!,
                date: e.eventDateUnix
            }))
    );

    let energyPoints = $derived(
        sortedEvents
            .filter((e) => e.energy !== undefined && e.energy !== null)
            .map((e) => ({
                x: xScale(e.eventDateUnix),
                y: yScale(e.energy!),
                value: e.energy!,
                date: e.eventDateUnix
            }))
    );

    let moodPath = $derived(generateLinePath(moodPoints));
    let energyPath = $derived(generateLinePath(energyPoints));

    // Y-axis ticks (generate ticks from minValue to maxValue)
    let yTicks = $derived.by(() => {
        const ticks: number[] = [];
        for (let i = minValue; i <= maxValue; i++) {
            ticks.push(i);
        }
        return ticks;
    });

    // X-axis date labels (only show labels for days with events)
    let xTicks = $derived.by(() => {
        if (sortedEvents.length === 0) return [];

        const maxLabels = 6;
        const ticks: { x: number; label: string }[] = [];

        if (sortedEvents.length <= maxLabels) {
            // Show all events if we have few enough
            for (const event of sortedEvents) {
                ticks.push({
                    x: xScale(event.eventDateUnix),
                    label: DateTime.fromSeconds(event.eventDateUnix).toFormat('dd/MM')
                });
            }
        } else {
            // Always include first and last, distribute others evenly
            const indices = [0];
            const middleCount = maxLabels - 2;
            const step = (sortedEvents.length - 1) / (middleCount + 1);

            for (let i = 1; i <= middleCount; i++) {
                indices.push(Math.round(step * i));
            }
            indices.push(sortedEvents.length - 1);

            for (const idx of indices) {
                const event = sortedEvents[idx];
                ticks.push({
                    x: xScale(event.eventDateUnix),
                    label: DateTime.fromSeconds(event.eventDateUnix).toFormat('dd/MM')
                });
            }
        }

        return ticks;
    });

    // Monday vertical lines
    let mondayLines = $derived.by(() => {
        if (sortedEvents.length === 0) return [];

        const minDate = sortedEvents[0].eventDateUnix;
        const maxDate = sortedEvents[sortedEvents.length - 1].eventDateUnix;

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

    // Mouse hover state for cursor line
    let hoverX = $state<number | null>(null);
    let hoverDate = $state<DateTime | null>(null);

    const handleMouseMove = (e: MouseEvent) => {
        if (sortedEvents.length === 0) return;

        const svg = e.currentTarget as SVGSVGElement;
        const rect = svg.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * width;
        const chartX = svgX - padding.left;

        if (chartX >= 0 && chartX <= chartWidth) {
            hoverX = chartX;

            // Convert x position back to date
            const minDate = sortedEvents[0].eventDateUnix;
            const maxDate = sortedEvents[sortedEvents.length - 1].eventDateUnix;
            const range = maxDate - minDate || 1;
            const timestamp = minDate + (chartX / chartWidth) * range;
            hoverDate = DateTime.fromSeconds(timestamp).startOf('day');
        } else {
            hoverX = null;
            hoverDate = null;
        }
    };

    const handleMouseLeave = () => {
        hoverX = null;
        hoverDate = null;
    };

    // Tooltip state
    let hoveredPoint = $state<{
        x: number;
        y: number;
        type: 'mood' | 'energy';
        value: number;
        date: number;
    } | null>(null);

    const formatDate = (unix: number) => DateTime.fromSeconds(unix).toFormat('dd MMM yyyy');
</script>

<div class="mood-energy-chart">
    <h3>Mood & Energy Evolution</h3>

    {#if sortedEvents.length === 0}
        <p class="no-data">No events recorded in this time period</p>
    {:else}
        <div class="chart-container" bind:clientWidth={containerWidth}>
            <svg
                viewBox="0 0 {width} {height}"
                class="line-chart"
                onmousemove={handleMouseMove}
                onmouseleave={handleMouseLeave}
            >
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

                <!-- Chart area -->
                <g transform="translate({padding.left}, {padding.top})">
                    <!-- Energy line (drawn first, behind mood) -->
                    {#if energyPath}
                        <path d={energyPath} class="line energy-line" />
                    {/if}

                    <!-- Mood line -->
                    {#if moodPath}
                        <path d={moodPath} class="line mood-line" />
                    {/if}

                    <!-- Energy points -->
                    {#each energyPoints as point}
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            class="point energy-point"
                            onmouseenter={() => (hoveredPoint = { ...point, type: 'energy' })}
                            onmouseleave={() => (hoveredPoint = null)}
                        />
                    {/each}

                    <!-- Mood points -->
                    {#each moodPoints as point}
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            class="point mood-point"
                            onmouseenter={() => (hoveredPoint = { ...point, type: 'mood' })}
                            onmouseleave={() => (hoveredPoint = null)}
                        />
                    {/each}
                </g>

                <!-- Y-axis -->
                <g class="y-axis">
                    {#each yTicks as tick}
                        <text
                            x={padding.left - 8}
                            y={padding.top + yScale(tick) + 4}
                            class="axis-label"
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

                <!-- Tooltip -->
                {#if hoveredPoint}
                    <g
                        class="tooltip"
                        transform="translate({padding.left + hoveredPoint.x}, {padding.top +
                            hoveredPoint.y})"
                    >
                        <rect x="-60" y="-45" width="120" height="40" rx="4" class="tooltip-bg" />
                        <text x="0" y="-30" text-anchor="middle" class="tooltip-title">
                            {hoveredPoint.type === 'mood' ? 'Mood' : 'Energy'}: {hoveredPoint.value}
                        </text>
                        <text x="0" y="-14" text-anchor="middle" class="tooltip-label">
                            {hoveredPoint.type === 'mood'
                                ? moodLabels[hoveredPoint.value]
                                : energyLabels[hoveredPoint.value]}
                        </text>
                    </g>
                {/if}

                <!-- Hover cursor line -->
                {#if hoverX !== null && hoverDate}
                    <g class="hover-cursor">
                        <line
                            x1={padding.left + hoverX}
                            y1={padding.top}
                            x2={padding.left + hoverX}
                            y2={padding.top + chartHeight}
                            class="hover-line"
                        />
                        <text
                            x={padding.left + hoverX}
                            y={padding.top - 6}
                            text-anchor="middle"
                            class="hover-date"
                        >
                            {hoverDate.toFormat('dd/MM')}
                        </text>
                    </g>
                {/if}
            </svg>

            <div class="legend">
                <div class="legend-item">
                    <span class="legend-line mood"></span>
                    <span>Mood</span>
                </div>
                <div class="legend-item">
                    <span class="legend-line energy"></span>
                    <span>Energy</span>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .mood-energy-chart {
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

    .line-chart {
        width: 100%;
        min-width: 450px;
        max-height: 450px;
        height: auto;
        background: var(--nc-bg-2);
        border-radius: 8px;
    }

    .grid-line {
        stroke: var(--nc-bg-3);
        stroke-width: 1;
        stroke-dasharray: 4 4;
    }

    .monday-line {
        stroke: var(--nc-tx-2);
        stroke-width: 1.5;
        opacity: 0.5;
    }

    .hover-line {
        stroke: var(--nc-tx-2);
        stroke-width: 1;
        stroke-dasharray: 2 2;
    }

    .hover-date {
        font-size: 10px;
        fill: var(--nc-tx-2);
        font-weight: 500;
    }

    .line {
        fill: none;
        stroke-width: 2.5;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .mood-line {
        stroke: #e91e9e;
    }

    .energy-line {
        stroke: #00bcd4;
    }

    .point {
        cursor: pointer;
        transition: r 0.15s ease;

        &:hover {
            r: 6;
        }
    }

    .mood-point {
        fill: #e91e9e;
    }

    .energy-point {
        fill: #00bcd4;
    }

    .axis-label {
        font-size: 11px;
        fill: var(--nc-tx-2);
        text-anchor: end;
    }

    .tooltip-bg {
        fill: var(--nc-bg-1);
        stroke: var(--nc-bg-3);
        stroke-width: 1;
    }

    .tooltip-title {
        font-size: 12px;
        font-weight: 600;
        fill: var(--nc-tx-1);
    }

    .tooltip-label {
        font-size: 11px;
        fill: var(--nc-tx-2);
    }

    .legend {
        display: flex;
        gap: 1.5rem;
        justify-content: center;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
    }

    .legend-line {
        display: inline-block;
        width: 24px;
        height: 3px;
        border-radius: 2px;

        &.mood {
            background: #e91e9e;
        }

        &.energy {
            background: #00bcd4;
        }
    }
</style>
