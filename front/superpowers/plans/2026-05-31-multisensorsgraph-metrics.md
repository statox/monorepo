# MultiSensorsGraph — Metrics Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `Metrics.svelte` as a toggleable stats panel below each sensor graph, showing first/last/min/max/avg/delta per sensor for the current time window and metric type.

**Architecture:** A new `computeMetricsStats` service function computes all stats from `histogramData` and returns a typed array; `Metrics.svelte` calls it via `$derived` and renders a CSS-only hybrid layout (cards on mobile, table on desktop). `Main.svelte` owns the toggle state and conditionally renders `Metrics`.

**Tech Stack:** SvelteKit 5 (Svelte runes), Chart.js, Luxon, `$lib/components/ValueWithUnit`, `$lib/components/DataTrend`

**Spec:** `superpowers/specs/2026-05-31-multisensorsgraph-metrics-design.md`

---

## File map

| File                                                                         | Action | Purpose                                                            |
| ---------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| `src/lib/HomeTracker/types.ts`                                               | Modify | Add `MetricDataPoint`, `SensorMetricStats`                         |
| `src/lib/HomeTracker/service.ts`                                             | Modify | Add `computeMetricsStats`                                          |
| `src/routes/(apps)/home-tracker/components/MultiSensorsGraph/types.ts`       | Modify | Add `graphsProperties` export, import `HomeTrackerTimeData`        |
| `src/routes/(apps)/home-tracker/components/MultiSensorsGraph/Main.svelte`    | Modify | Import `graphsProperties` from `./types`; add toggle + `<Metrics>` |
| `src/routes/(apps)/home-tracker/components/MultiSensorsGraph/Metrics.svelte` | Modify | Full implementation                                                |

---

## Task 1: Add types to HomeTracker/types.ts

**Files:**

- Modify: `src/lib/HomeTracker/types.ts`

- [ ] **Step 1: Add `MetricDataPoint` and `SensorMetricStats` to the end of the file**

```typescript
export interface MetricDataPoint {
    ts: number;
    value: number;
}

export interface SensorMetricStats {
    sensorName: string;
    hexColor: string;
    iconPath: string;
    first: MetricDataPoint;
    last: MetricDataPoint;
    min: MetricDataPoint;
    max: MetricDataPoint;
    average: number;
}
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/HomeTracker/types.ts
git commit -m "feat(home-tracker): add MetricDataPoint and SensorMetricStats types"
```

---

## Task 2: Extract graphsProperties to MultiSensorsGraph/types.ts

`graphsProperties` is currently defined inline in `Main.svelte`. It needs to be shared with `Metrics.svelte`, so move it to `types.ts`.

**Files:**

- Modify: `src/routes/(apps)/home-tracker/components/MultiSensorsGraph/types.ts`

- [ ] **Step 1: Replace the full content of `types.ts` with**

```typescript
import type { HomeTrackerTimeData } from '$lib/HomeTracker';

export type GraphType =
    | 'temperature'
    | 'humidity'
    | 'battery'
    | 'pressure'
    | 'internalTemperature'
    | 'internalHumidity';

export interface GraphTypeProperties {
    graphName: string;
    metricUnitSymbol: string;
    metricProperty: keyof HomeTrackerTimeData;
}

export const graphsProperties: Record<GraphType, GraphTypeProperties> = {
    temperature: {
        graphName: 'Temperature',
        metricProperty: 'tempCelsius',
        metricUnitSymbol: 'C'
    },
    battery: {
        graphName: 'Battery',
        metricProperty: 'batteryCharge',
        metricUnitSymbol: 'V'
    },
    humidity: {
        graphName: 'Humidity',
        metricProperty: 'humidity',
        metricUnitSymbol: '%'
    },
    pressure: {
        graphName: 'Pressure',
        metricProperty: 'pressurehPa',
        metricUnitSymbol: 'hPa'
    },
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
```

- [ ] **Step 2: Update `Main.svelte` to import `graphsProperties` from `./types` instead of defining it inline**

In `Main.svelte`, find the `import type { GraphType } from './types';` line and replace it with:

```typescript
import { graphsProperties, type GraphType } from './types';
```

Then delete the entire `const graphsProperties: Record<GraphType, ...> = { ... }` block from the script (lines 43–69 in the original file).

- [ ] **Step 3: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/(apps)/home-tracker/components/MultiSensorsGraph/types.ts \
        src/routes/(apps)/home-tracker/components/MultiSensorsGraph/Main.svelte
git commit -m "refactor(home-tracker): extract graphsProperties to MultiSensorsGraph/types.ts"
```

---

## Task 3: Implement computeMetricsStats in HomeTracker/service.ts

**Files:**

- Modify: `src/lib/HomeTracker/service.ts`

- [ ] **Step 1: Add the import at the top of `service.ts`**

The file currently contains only `export {};`. Replace it entirely with:

```typescript
import type {
    HomeTrackerHistogramData,
    HomeTrackerTimeData,
    MetricDataPoint,
    SensorMetricStats,
    SensorMetadata
} from './types';

export const computeMetricsStats = (
    histogramData: HomeTrackerHistogramData,
    sensorNames: string[],
    sensorsData: SensorMetadata[],
    metricProperty: keyof HomeTrackerTimeData
): SensorMetricStats[] => {
    return sensorNames.reduce<SensorMetricStats[]>((acc, sensorName) => {
        const sensorMetadata = sensorsData.find((s) => s.sensorName === sensorName);
        const offset = metricProperty === 'tempCelsius' ? (sensorMetadata?.tempOffset ?? 0) : 0;

        const points: MetricDataPoint[] = Object.keys(histogramData)
            .filter((ts) => {
                const key = ts as unknown as keyof HomeTrackerHistogramData;
                return histogramData[key]?.[metricProperty]?.[sensorName] !== undefined;
            })
            .map((ts) => {
                const key = ts as unknown as keyof HomeTrackerHistogramData;
                return {
                    ts: Number(ts),
                    value: histogramData[key]![metricProperty]![sensorName]! + offset
                };
            })
            .sort((a, b) => a.ts - b.ts);

        if (points.length === 0) return acc;

        const first = points[0];
        const last = points[points.length - 1];
        const min = points.reduce((m, p) => (p.value < m.value ? p : m), points[0]);
        const max = points.reduce((m, p) => (p.value > m.value ? p : m), points[0]);
        const average = points.reduce((sum, p) => sum + p.value, 0) / points.length;

        acc.push({
            sensorName,
            hexColor: sensorMetadata?.hexColor ?? '#141414',
            iconPath: sensorMetadata?.iconPath ?? '',
            first,
            last,
            min,
            max,
            average
        });

        return acc;
    }, []);
};
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/HomeTracker/service.ts
git commit -m "feat(home-tracker): add computeMetricsStats service function"
```

---

## Task 4: Update Main.svelte with toggle and Metrics child

**Files:**

- Modify: `src/routes/(apps)/home-tracker/components/MultiSensorsGraph/Main.svelte`

- [ ] **Step 1: Add the Metrics import at the top of the script block** (after the existing imports)

```typescript
import Metrics from './Metrics.svelte';
```

- [ ] **Step 2: Add toggle state** (after the `let chartElement` declaration)

```typescript
let showMetrics = $state(true);
```

- [ ] **Step 3: Replace the template section** (currently just `<h2>` + `<canvas>` + `<style>`) with:

```svelte
<h2>{graphName} ({metricUnitSymbol})</h2>

<canvas class="graph-canvas" bind:this={chartElement}></canvas>

<button class="toggle-metrics" onclick={() => (showMetrics = !showMetrics)}>
    {showMetrics ? 'hide stats' : 'see stats'}
</button>

{#if showMetrics}
    <Metrics {sensorsData} {sensorNames} {histogramData} {graphType} />
{/if}

<style>
    .graph-canvas {
        max-height: 300px;
    }

    .toggle-metrics {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.85em;
        color: var(--nc-lk-1);
        padding: 0.25rem 0;
        display: block;
        margin-top: 0.25rem;
    }

    .toggle-metrics:hover {
        text-decoration: underline;
    }
</style>
```

- [ ] **Step 4: Run type check**

```bash
npm run check
```

Expected: 0 errors (Metrics.svelte not yet implemented, so there may be an import error — that's fine, proceed).

---

## Task 5: Implement Metrics.svelte

**Files:**

- Modify: `src/routes/(apps)/home-tracker/components/MultiSensorsGraph/Metrics.svelte`

- [ ] **Step 1: Replace the full content of Metrics.svelte with**

```svelte
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

<!-- Mobile: cards -->
<div class="mobile-cards">
    {#each stats as stat}
        <div class="sensor-card">
            <div class="sensor-header">
                <img src={stat.iconPath} alt={stat.sensorName} class="sensor-icon" />
                <span class="sensor-name" style="color: {stat.hexColor}">{stat.sensorName}</span>
            </div>
            <div class="stat-grid">
                <span class="label">First</span>
                <span class="ts">{formatRecordTimestampToHuman(stat.first.ts)}</span>
                <span class="val"
                    ><ValueWithUnit value={stat.first.value} unitString={metricUnitSymbol} /></span
                >

                <span class="label">Last</span>
                <span class="ts">{formatRecordTimestampToHuman(stat.last.ts)}</span>
                <span class="val"
                    ><ValueWithUnit value={stat.last.value} unitString={metricUnitSymbol} /></span
                >

                <span class="label">Min</span>
                <span class="ts">{formatRecordTimestampToHuman(stat.min.ts)}</span>
                <span class="val"
                    ><ValueWithUnit value={stat.min.value} unitString={metricUnitSymbol} /></span
                >

                <span class="label">Max</span>
                <span class="ts">{formatRecordTimestampToHuman(stat.max.ts)}</span>
                <span class="val"
                    ><ValueWithUnit value={stat.max.value} unitString={metricUnitSymbol} /></span
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
                            <img src={stat.iconPath} alt={stat.sensorName} class="sensor-icon" />
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

<style>
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
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-bottom: 0.4rem;
        font-weight: bold;
    }

    .sensor-icon {
        height: 1em;
        width: 1em;
        object-fit: contain;
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
        display: flex;
        align-items: center;
        gap: 0.4rem;
        white-space: nowrap;
    }
</style>
```

- [ ] **Step 2: Run type check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: 0 errors (the pre-existing unused-vars errors in Metrics.svelte should now be gone).

- [ ] **Step 4: Commit**

```bash
git add src/routes/(apps)/home-tracker/components/MultiSensorsGraph/Metrics.svelte \
        src/routes/(apps)/home-tracker/components/MultiSensorsGraph/Main.svelte
git commit -m "feat(home-tracker): implement Metrics stats panel in MultiSensorsGraph"
```
