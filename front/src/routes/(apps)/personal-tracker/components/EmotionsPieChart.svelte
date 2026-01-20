<script lang="ts">
    import type { PersonalTrackerEvent } from '$lib/PersonalTracker';

    interface Props {
        events: PersonalTrackerEvent[];
    }

    let { events }: Props = $props();

    // Aggregate emotions from all events
    interface EmotionCount {
        emotion: string;
        category: string;
        subcategory: string;
        color: string;
        count: number;
    }

    let emotionCounts = $derived.by(() => {
        const counts = new Map<string, EmotionCount>();

        for (const event of events) {
            if (event.emotionwheel?.emotions) {
                for (const item of event.emotionwheel.emotions) {
                    const existing = counts.get(item.emotion);
                    if (existing) {
                        existing.count++;
                    } else {
                        counts.set(item.emotion, {
                            emotion: item.emotion,
                            category: item.category,
                            subcategory: item.subcategory,
                            color: item.color,
                            count: 1
                        });
                    }
                }
            }
        }

        // Sort by category, then subcategory, then by count within each group
        return Array.from(counts.values()).sort((a, b) => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            if (a.subcategory !== b.subcategory) {
                return a.subcategory.localeCompare(b.subcategory);
            }
            return b.count - a.count;
        });
    });

    let totalEmotions = $derived(emotionCounts.reduce((sum, e) => sum + e.count, 0));

    // Calculate pie chart slices
    interface PieSlice {
        emotion: string;
        color: string;
        count: number;
        percentage: number;
        startAngle: number;
        endAngle: number;
        path: string;
        labelX: number;
        labelY: number;
    }

    let pieSlices = $derived.by(() => {
        if (totalEmotions === 0) return [];

        const slices: PieSlice[] = [];
        let currentAngle = -90; // Start from top

        const cx = 150;
        const cy = 150;
        const radius = 120;

        for (const item of emotionCounts) {
            const percentage = (item.count / totalEmotions) * 100;
            const sliceAngle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;

            // Calculate path
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);

            const largeArc = sliceAngle > 180 ? 1 : 0;

            const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            // Calculate label position (middle of the slice, at 65% radius)
            const midAngle = (startAngle + endAngle) / 2;
            const midRad = (midAngle * Math.PI) / 180;
            const labelRadius = radius * 0.65;
            const labelX = cx + labelRadius * Math.cos(midRad);
            const labelY = cy + labelRadius * Math.sin(midRad);

            slices.push({
                emotion: item.emotion,
                color: item.color,
                count: item.count,
                percentage,
                startAngle,
                endAngle,
                path,
                labelX,
                labelY
            });

            currentAngle = endAngle;
        }

        return slices;
    });

    // Group emotions by category for the legend
    interface CategoryGroup {
        category: string;
        emotions: EmotionCount[];
    }

    let groupedByCategory = $derived.by(() => {
        const groups = new Map<string, EmotionCount[]>();

        for (const item of emotionCounts) {
            const existing = groups.get(item.category);
            if (existing) {
                existing.push(item);
            } else {
                groups.set(item.category, [item]);
            }
        }

        return Array.from(groups.entries())
            .map(([category, emotions]) => {
                const categoryCount = emotions.reduce((sum, e) => sum + e.count, 0);
                const percentage = totalEmotions > 0 ? (categoryCount / totalEmotions) * 100 : 0;
                return {
                    category,
                    emotions,
                    percentage
                };
            })
            .sort((a, b) => b.percentage - a.percentage);
    });
</script>

<div class="emotions-pie-chart">
    <h3>Emotions Distribution</h3>

    {#if pieSlices.length === 0}
        <p class="no-data">No emotions recorded in this time period</p>
    {:else}
        <div class="chart-wrapper">
            <svg viewBox="0 0 300 300" class="pie-chart">
                {#each pieSlices as slice}
                    <path d={slice.path} fill={slice.color} class="pie-slice">
                        <title
                            >{slice.emotion}: {slice.count} ({slice.percentage.toFixed(1)}%)</title
                        >
                    </path>
                {/each}
                {#each pieSlices as slice}
                    {#if slice.percentage >= 5}
                        <text
                            x={slice.labelX}
                            y={slice.labelY}
                            class="pie-label"
                            text-anchor="middle"
                            dominant-baseline="middle"
                        >
                            {slice.emotion}
                        </text>
                    {/if}
                {/each}
            </svg>

            <div class="legend">
                {#each groupedByCategory as group}
                    <div class="legend-category">
                        <div class="category-header">
                            <span>{group.category}</span>
                            <span class="category-percentage">{group.percentage.toFixed(1)}%</span>
                        </div>
                        <div class="category-items">
                            {#each group.emotions as item}
                                <div class="legend-item">
                                    <span class="legend-color" style="background-color: {item.color}"
                                    ></span>
                                    <span class="legend-label">{item.emotion}</span>
                                    <span class="legend-count">{item.count}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .emotions-pie-chart {
        margin-top: 1.5rem;

        h3 {
            margin-bottom: 1rem;
        }
    }

    .no-data {
        color: var(--nc-tx-2);
        font-style: italic;
    }

    .chart-wrapper {
        display: flex;
        gap: 2rem;
        align-items: flex-start;
        flex-wrap: wrap;
    }

    .pie-chart {
        width: 100%;
        max-width: 500px;
        height: auto;
        aspect-ratio: 1;
        flex-shrink: 0;
    }

    .pie-slice {
        stroke: var(--nc-bg-1);
        stroke-width: 2;
        transition: opacity 0.2s;

        &:hover {
            opacity: 0.8;
        }
    }

    .pie-label {
        font-size: 11px;
        fill: #000;
        font-weight: 600;
        pointer-events: none;
        stroke: #fff;
        stroke-width: 3px;
        paint-order: stroke fill;
    }

    .legend {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .legend-category {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--nc-tx-1);
        margin-bottom: 0.25rem;
    }

    .category-percentage {
        font-weight: 500;
        color: var(--nc-tx-2);
    }

    .category-items {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding-left: 0.75rem;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .legend-color {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        flex-shrink: 0;
    }

    .legend-label {
        flex-grow: 1;
        font-size: 0.875rem;
    }

    .legend-count {
        color: var(--nc-tx-2);
        font-size: 0.8rem;
    }
</style>
