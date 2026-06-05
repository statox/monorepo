# MultiSensorsGraph — Metrics panel design

## Goal

Implement `Metrics.svelte` as a child of `Main.svelte`. It displays per-sensor statistics for the currently visible time window and metric type: first, last, min, max (value + timestamp), average, and delta.

## Files changed

| File                               | Change                                                    |
| ---------------------------------- | --------------------------------------------------------- |
| `src/lib/HomeTracker/types.ts`     | Add `MetricDataPoint`, `SensorMetricStats`                |
| `src/lib/HomeTracker/service.ts`   | Add `computeMetricsStats`                                 |
| `MultiSensorsGraph/types.ts`       | Extract `graphsProperties` from `Main.svelte`, export it  |
| `MultiSensorsGraph/Main.svelte`    | Import `graphsProperties`; add toggle state + `<Metrics>` |
| `MultiSensorsGraph/Metrics.svelte` | Full implementation                                       |

## Types

Added to `src/lib/HomeTracker/types.ts`:

```typescript
export interface MetricDataPoint {
    ts: number; // Unix ms
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

## Service function

Added to `src/lib/HomeTracker/service.ts`:

```typescript
computeMetricsStats(
    histogramData: HomeTrackerHistogramData,
    sensorNames: string[],
    sensorsData: SensorMetadata[],
    metricProperty: keyof HomeTrackerTimeData
): SensorMetricStats[]
```

- For each sensor, extracts `{ ts, value }` pairs where the metric is present.
- Applies `tempOffset` from `SensorMetadata` when `metricProperty === 'tempCelsius'`, matching the existing graph logic.
- Computes first (lowest ts), last (highest ts), min (lowest value), max (highest value), average.
- Sensors with no data points for the metric are skipped (not included in output).

## Shared config refactor

`graphsProperties` is currently defined inline in `Main.svelte`. It maps each `GraphType` to `{ graphName, metricUnitSymbol, metricProperty }`. It is moved to `MultiSensorsGraph/types.ts` and exported so both `Main.svelte` and `Metrics.svelte` can import it without duplication.

```typescript
// MultiSensorsGraph/types.ts
export type GraphType = ...

export const graphsProperties: Record<
    GraphType,
    { graphName: string; metricUnitSymbol: string; metricProperty: keyof HomeTrackerTimeData }
> = { ... }
```

## Main.svelte changes

- Import `graphsProperties` from `./types` instead of defining it inline.
- Add toggle state (default visible):
    ```typescript
    let showMetrics = $state(true);
    ```
- Below `<canvas>`, add toggle trigger and conditional `<Metrics>`:

    ```svelte
    <button class="toggle-metrics" onclick={() => (showMetrics = !showMetrics)}>
        {showMetrics ? 'hide stats' : 'see stats'}
    </button>

    {#if showMetrics}
        <Metrics {sensorsData} {sensorNames} {histogramData} {graphType} />
    {/if}
    ```

## Metrics.svelte

### Props (unchanged from current WIP)

```typescript
interface Props {
    sensorsData: SensorMetadata[];
    sensorNames: string[];
    histogramData: HomeTrackerHistogramData;
    graphType: GraphType;
}
```

### Derived state

```typescript
const { metricProperty, metricUnitSymbol } = $derived(graphsProperties[graphType]);
const stats = $derived(
    computeMetricsStats(histogramData, sensorNames, sensorsData, metricProperty)
);
```

### Value display

Each numeric value uses `<ValueWithUnit value={stat.first.value} unitString={metricUnitSymbol} />`. Timestamps use `formatRecordTimestampToHuman(stat.first.ts)`.

### Delta display

```svelte
<DataTrend
    oldValue={stat.first.value}
    newValue={stat.last.value}
    oldTimestamp={stat.first.ts}
    newTimestamp={stat.last.ts}
/>
```

### Responsive layout

CSS-only breakpoint (no JS):

- **Mobile (narrow):** one card per sensor. Sensor name colored with `hexColor`, icon at name font size. Stats as label/value pairs.
- **Desktop (wide):** table. Rows = sensors (name + icon), columns = First / Last / Min / Max / Avg / Delta.
