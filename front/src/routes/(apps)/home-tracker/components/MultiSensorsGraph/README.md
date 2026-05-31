# MultiSensorsGraph

A Chart.js line graph that plots one sensor metric over time for all monitored sensors. One instance = one metric type. `SensorsHistogram.svelte` renders six instances in a loop, one per `GraphType`.

## Props

| Prop            | Type                       | Description                                                                                                           |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `sensorsData`   | `SensorMetadata[]`         | Metadata for all sensors (color, temp offset, etc.)                                                                   |
| `sensorNames`   | `string[]`                 | Which sensor names to plot (subset of what's in `histogramData`)                                                      |
| `histogramData` | `HomeTrackerHistogramData` | Time-series data keyed by Unix timestamp in ms                                                                        |
| `graphType`     | `GraphType`                | Which metric to display (`temperature`, `humidity`, `battery`, `pressure`, `internalTemperature`, `internalHumidity`) |

## Data structures

### `HomeTrackerHistogramData`

```
{
  [timestampMs: number]: {
    tempCelsius?:        { [sensorName]: number },
    internalTempCelsius?: { [sensorName]: number },
    batteryCharge?:      { [sensorName]: number },
    humidity?:           { [sensorName]: number },
    internalHumidity?:   { [sensorName]: number },
    pressurehPa?:        { [sensorName]: number },
  }
}
```

All metric fields are optional — a sensor only appears under a timestamp if it reported that metric at that time.

### `SensorMetadata`

Relevant fields used by this component:

- `sensorName` — used to match entries in `histogramData`
- `hexColor` — 6-digit hex (no `#` needed separately; the component appends a 2-digit alpha suffix)
- `tempOffset` — applied only when `graphType === 'temperature'`; added to every data point for that sensor

## How a dataset is built

For each sensor name in `sensorNames`:

1. Filter `histogramData` timestamps to those where `histogramData[ts][metricProperty][sensorName]` exists.
2. Map each surviving timestamp to `{ x: ts, y: value + offset }` (offset is 0 for non-temperature graphs).
3. If the resulting `data` array is non-empty, push a Chart.js dataset with the sensor's color (at 50% alpha for borders, 70% for points).

Sensors with no data for the selected metric and time window are silently skipped.

## Color encoding

Colors come from `SensorMetadata.hexColor`. Three alpha levels are used:

- `4D` (~30%) — not currently assigned to a dataset property (dark mode, reserved)
- `80` (~50%) — `borderColor`, `pointBorderColor`
- `B3` (~70%) — `pointBackgroundColor`

## Point radius scaling

Automatically reduced as the number of data points grows to avoid visual clutter:

- < 30 points → radius 6
- 30–199 points → radius 4
- ≥ 200 points → radius 2

There's a TODO to also factor in the viewport width for mobile.

## Hover line plugin

A custom Chart.js `afterDraw` plugin draws a white vertical line through the active tooltip position. It fires only when a data point is hovered (checked via `chart.tooltip._active.length > 0`). The plugin accesses two internal Chart.js properties (`_active`) that lack proper typings, hence the `@ts-expect-error` comments.

## Lifecycle note

The Chart instance is created once in `onMount`. The chart does **not** react to prop changes after mount — if `histogramData` or `graphType` changes, the parent must remount the component (e.g. via a keyed `{#each}` or conditional block). This is the current behavior in `SensorsHistogram.svelte` where the entire graph list is re-rendered when the time window changes.
