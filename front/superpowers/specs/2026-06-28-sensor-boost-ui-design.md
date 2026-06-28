# Sensor Boost UI - Design

Date: 2026-06-28

## Goal

Update the HomeTracker `Metadata.svelte` sensor card to:
1. Display the sensor's default sleep time (`sleepTimeSecDefault`).
2. Show a "Boost resets in" countdown when a boost is currently active.
3. Add a "Boost (2min/10min)" button that enables boost mode (120s sleep, 600s duration) for the selected sensor.

## Context

- `sleepTimeSecDefault` and `nextSleepTimeResetUnix` are now returned by
  `/homeTracker/getSensorsDataForDashboard` (added in the backend boost feature).
- The SDK exposes `client2.homeTracker.enableSensorBoost({ sensorName, sleepTimeSec, durationSec })`.
- The Boost button has the same visibility as the existing Reset button: always rendered,
  no `{#if $user}` gate. Clicking it while unauthenticated will show an error toast (same
  behaviour as Reset).

## Files changed

- `front/src/lib/HomeTracker/types.ts` — add two fields to `SensorMetadata`.
- `front/src/lib/HomeTracker/api.ts` — export `enableSensorBoost`.
- `front/src/routes/(apps)/home-tracker/components/SensorCard/Metadata.svelte` — display + button.

## Data layer

### `types.ts`

Add to `SensorMetadata`:

```ts
sleepTimeSecDefault: number;
nextSleepTimeResetUnix: number;
```

### `api.ts`

```ts
export const enableSensorBoost = client2.homeTracker.enableSensorBoost;
```

## Component changes (`Metadata.svelte`)

### New imports / script

```ts
import { enableSensorBoost } from '$lib/HomeTracker';
```

Two `$derived` values (recalculated whenever `sensor` changes, i.e. on each data refresh):

```ts
const boostIsActive = $derived(sensor.nextSleepTimeResetUnix * 1000 > Date.now());
const boostRemainingFormatted = $derived(
    Duration.fromMillis(sensor.nextSleepTimeResetUnix * 1000 - Date.now()).toFormat("mm'm'ss's'")
);
```

`enableBoost` handler - mirrors `updateMetadata` in structure:

```ts
const enableBoost = async () => {
    try {
        await enableSensorBoost({
            sensorName: sensor.sensorName,
            sleepTimeSec: 120,
            durationSec: 600
        });
        toast.push('<i class="fas fa-check"></i> Boost enabled');
        const event = new CustomEvent('HomeTracker-RefreshData');
        document.dispatchEvent(event);
    } catch (error) {
        const errorMessage = (error as Error).message;
        const message = `<strong>Boost failed</strong><br/> ${errorMessage}`;
        toast.push(message, { theme: { '--toastBarBackground': '#FF0000' } });
    }
};
```

### Template

Grid rows added after the existing "Sleep time" row:

```svelte
<div>Default sleep time</div>
<span>
    {sensor.sleepTimeSecDefault}s
    {Duration.fromMillis(sensor.sleepTimeSecDefault * 1000).toFormat("mm'm'ss's'")}
</span>

{#if boostIsActive}
    <div>Boost resets in</div>
    <span>{boostRemainingFormatted}</span>
{/if}
```

Boost button added inline in the "Sleep time" `<span>` alongside the existing Reset button:

```svelte
<div>Sleep time (s)</div>
<span>
    <input disabled={!$user} bind:value={sleepTimeSec} type="number" />
    {Duration.fromMillis(sleepTimeSec * 1000).toFormat("mm'm'ss's'")}
    <button onclick={resetToDefaultSleepTime}>Reset</button>
    <button onclick={enableBoost}>Boost (2min/10min)</button>
</span>
```

No `{#if $user}` gate on the Boost button — matches the existing Reset button.

## Out of scope

- Live countdown tick (the remaining time updates on data refresh, not every second).
- Configurable boost parameters from the UI (hardcoded: 120s sleep, 600s duration).
- Disabling the Boost button when a boost is already active.
