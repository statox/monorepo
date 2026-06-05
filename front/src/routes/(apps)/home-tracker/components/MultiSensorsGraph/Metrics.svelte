<script lang="ts">
    import {
        type HomeTrackerHistogramData,
        type SensorMetadata,
        computeMetricsStats,
        formatRecordTimestampToHuman
    } from '$lib/HomeTracker';
    import { ValueWithUnit } from '$lib/components/ValueWithUnit';
    import DataTrend from '../DataTrend.svelte';
    import { graphsProperties, type GraphType } from './types';
    import { showMetrics } from './store';

    interface Props {
        sensorsData: SensorMetadata[];
        sensorNames: string[];
        histogramData: HomeTrackerHistogramData;
        graphType: GraphType;
    }

    let { sensorsData, sensorNames, histogramData, graphType }: Props = $props();

    const { metricProperty, metricUnitSymbol } = $derived(graphsProperties[graphType]);

    const stats = $derived(
        computeMetricsStats(histogramData, sensorNames, sensorsData, metricProperty)
    );
</script>

<button class="toggle-stats" onclick={() => showMetrics.update((v) => !v)}>
    {$showMetrics ? 'hide stats' : 'see stats'}
</button>

{#if $showMetrics}
    <!-- Mobile: cards -->
    <div class="mobile-cards">
        {#each stats as stat}
            <div class="sensor-card">
                <div class="sensor-header">
                    <img src={stat.iconPath} alt={stat.sensorName} class="sensor-icon" />
                    <span class="sensor-name" style="color: {stat.hexColor}">{stat.sensorName}</span
                    >
                </div>
                <div class="stat-grid">
                    <span class="label">First</span>
                    <span class="ts">{formatRecordTimestampToHuman(stat.first.ts)}</span>
                    <span class="val"
                        ><ValueWithUnit
                            value={stat.first.value}
                            unitString={metricUnitSymbol}
                        /></span
                    >

                    <span class="label">Last</span>
                    <span class="ts">{formatRecordTimestampToHuman(stat.last.ts)}</span>
                    <span class="val"
                        ><ValueWithUnit
                            value={stat.last.value}
                            unitString={metricUnitSymbol}
                        /></span
                    >

                    <span class="label">Min</span>
                    <span class="ts">{formatRecordTimestampToHuman(stat.min.ts)}</span>
                    <span class="val"
                        ><ValueWithUnit
                            value={stat.min.value}
                            unitString={metricUnitSymbol}
                        /></span
                    >

                    <span class="label">Max</span>
                    <span class="ts">{formatRecordTimestampToHuman(stat.max.ts)}</span>
                    <span class="val"
                        ><ValueWithUnit
                            value={stat.max.value}
                            unitString={metricUnitSymbol}
                        /></span
                    >

                    <span class="label">Avg</span>
                    <span class="ts"></span>
                    <span class="val"
                        ><ValueWithUnit value={stat.average} unitString={metricUnitSymbol} /></span
                    >

                    <span class="label">Delta</span>
                    <span class="ts"></span>
                    <span class="val">
                        <DataTrend
                            oldValue={stat.first.value}
                            newValue={stat.last.value}
                            oldTimestamp={stat.first.ts}
                            newTimestamp={stat.last.ts}
                        />
                    </span>
                </div>
            </div>
        {/each}
    </div>

    <!-- Desktop: table -->
    <div class="desktop-table">
        <table>
            <thead>
                <tr>
                    <th>Sensor</th>
                    <th>First</th>
                    <th>Last</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Avg</th>
                    <th>Delta</th>
                </tr>
            </thead>
            <tbody>
                {#each stats as stat}
                    <tr>
                        <td>
                            <span class="sensor-cell">
                                <img
                                    src={stat.iconPath}
                                    alt={stat.sensorName}
                                    class="sensor-icon"
                                />
                                <span style="color: {stat.hexColor}">{stat.sensorName}</span>
                            </span>
                        </td>
                        <td>
                            <ValueWithUnit value={stat.first.value} unitString={metricUnitSymbol} />
                            <div class="ts">{formatRecordTimestampToHuman(stat.first.ts)}</div>
                        </td>
                        <td>
                            <ValueWithUnit value={stat.last.value} unitString={metricUnitSymbol} />
                            <div class="ts">{formatRecordTimestampToHuman(stat.last.ts)}</div>
                        </td>
                        <td>
                            <ValueWithUnit value={stat.min.value} unitString={metricUnitSymbol} />
                            <div class="ts">{formatRecordTimestampToHuman(stat.min.ts)}</div>
                        </td>
                        <td>
                            <ValueWithUnit value={stat.max.value} unitString={metricUnitSymbol} />
                            <div class="ts">{formatRecordTimestampToHuman(stat.max.ts)}</div>
                        </td>
                        <td>
                            <ValueWithUnit value={stat.average} unitString={metricUnitSymbol} />
                        </td>
                        <td>
                            <DataTrend
                                oldValue={stat.first.value}
                                newValue={stat.last.value}
                                oldTimestamp={stat.first.ts}
                                newTimestamp={stat.last.ts}
                            />
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}

<style>
    .toggle-stats {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.85em;
        color: var(--nc-lk-1);
        padding: 0.25rem 0;
        display: block;
        margin-top: 0.25rem;
    }

    .toggle-stats:hover {
        text-decoration: underline;
    }

    .mobile-cards {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    .desktop-table {
        display: none;
    }

    @media (min-width: 600px) {
        .mobile-cards {
            display: none;
        }

        .desktop-table {
            display: block;
            margin-top: 0.5rem;
            overflow-x: auto;
        }
    }

    .sensor-card {
        border: 1px solid var(--nc-bg-3);
        border-radius: 4px;
        padding: 0.5rem 0.75rem;
    }

    .sensor-header {
        margin-bottom: 0.4rem;
        font-weight: bold;
        text-align: left;
    }

    .sensor-icon {
        display: inline-block;
        vertical-align: middle;
        height: 1em;
        width: 1em;
        object-fit: contain;
        margin-right: 0.3rem;
    }

    .sensor-name {
        vertical-align: middle;
    }

    .stat-grid {
        display: grid;
        grid-template-columns: 3rem 1fr 1fr;
        gap: 0.15rem 0.5rem;
        font-size: 0.9em;
        align-items: center;
    }

    .label {
        color: var(--nc-tx-2);
        font-size: 0.85em;
    }

    .ts {
        color: var(--nc-tx-2);
        font-size: 0.85em;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9em;
    }

    th {
        text-align: left;
        color: var(--nc-tx-2);
        font-weight: normal;
        font-size: 0.85em;
        padding: 0.25rem 0.5rem;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    td {
        padding: 0.3rem 0.5rem;
        vertical-align: middle;
    }

    .sensor-cell {
        white-space: nowrap;
    }
</style>
