# Sensor Boost UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add boost mode display and a one-click Boost button to the HomeTracker sensor metadata card.

**Architecture:** Three-file change — add two fields to the `SensorMetadata` type, export `enableSensorBoost` from the API layer, then update `Metadata.svelte` to display default sleep time, a conditional boost-active countdown, and the Boost button alongside the existing Reset button.

**Tech Stack:** Svelte 5 (`$derived`, `$state`, `$props`), TypeScript, Luxon (Duration), statox-api SDK (`client2`).

---

## Spec

Design doc: `front/superpowers/specs/2026-06-28-sensor-boost-ui-design.md`

## File Structure

- Modify: `front/src/lib/HomeTracker/types.ts` — add `sleepTimeSecDefault` and `nextSleepTimeResetUnix` to `SensorMetadata`.
- Modify: `front/src/lib/HomeTracker/api.ts` — export `enableSensorBoost`.
- Modify: `front/src/routes/(apps)/home-tracker/components/SensorCard/Metadata.svelte` — display + button.

No new files. No test files (frontend has no unit test runner; verification is `npm run check` + `npm run lint` + `npm run prettier`).

---

## Task 1: Update `SensorMetadata` type and API export

**Files:**
- Modify: `front/src/lib/HomeTracker/types.ts:1-12`
- Modify: `front/src/lib/HomeTracker/api.ts`

- [ ] **Step 1: Add the two new fields to `SensorMetadata`**

In `front/src/lib/HomeTracker/types.ts`, update the `SensorMetadata` interface. The full interface should read:

```ts
export interface SensorMetadata {
    sensorName: string;
    iconPath: string;
    hexColor: string;
    tempOffset: number;
    sleepTimeSec: number;
    sleepTimeSecDefault: number;
    nextSleepTimeResetUnix: number;
    lastSyncDateUnix: number;
    lastAlertDateUnix: number | null;
    lastLogData: SensorLogData;
    oneHourAgoLogData: SensorLogData;
    oneDayAgoLogData: SensorLogData;
}
```

- [ ] **Step 2: Export `enableSensorBoost` from the API layer**

In `front/src/lib/HomeTracker/api.ts`, add one line after the existing `updateSensorMetadata` export:

```ts
export const enableSensorBoost = client2.homeTracker.enableSensorBoost;
```

The full file should read:

```ts
import { client2 } from '$lib/api';

export const getHistogramData = client2.homeTracker.histogramData;

export const getWeatherForecast = client2.homeTracker.getWeatherForecast;

export const getSensorsMetadata = async () => {
    const { sensors } = await client2.homeTracker.getSensorsDataForDashboard();

    // TODO Have this info returned by the API (and probably have the API returning the images themselves too)
    const enrichedSensors = sensors.map((sensor) => {
        const { sensorName } = sensor;
        return {
            ...sensor,
            iconPath: `/hometracker/sensors/icon_${sensorName}.png`
        };
    });

    return { sensors: enrichedSensors };
};

export const updateSensorMetadata = client2.homeTracker.updateSensorMetadata;

export const enableSensorBoost = client2.homeTracker.enableSensorBoost;
```

- [ ] **Step 3: Verify type-check passes**

Run from `front/`:

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add front/src/lib/HomeTracker/types.ts front/src/lib/HomeTracker/api.ts
git commit -m "HomeTracker - Add sleepTimeSecDefault, nextSleepTimeResetUnix to SensorMetadata and export enableSensorBoost"
```

---

## Task 2: Update `Metadata.svelte`

**Files:**
- Modify: `front/src/routes/(apps)/home-tracker/components/SensorCard/Metadata.svelte`

- [ ] **Step 1: Update the script block**

Replace the entire `<script lang="ts">` block with:

```svelte
<script lang="ts">
    import { user } from '$lib/auth';
    import { toast } from '$lib/components/Toast';
    import type { SensorMetadata } from '$lib/HomeTracker';
    import { enableSensorBoost, updateSensorMetadata } from '$lib/HomeTracker';
    import { Duration } from 'luxon';

    interface Props {
        sensor: SensorMetadata;
    }

    let { sensor }: Props = $props();
    // Initialize with empty values, will be set by effect
    let hexColor = $state<string>('');
    let tempOffset = $state<number>(0);
    let sleepTimeSec = $state<number>(0);

    // Sync state when sensor prop changes
    $effect(() => {
        hexColor = sensor.hexColor;
        tempOffset = sensor.tempOffset;
        sleepTimeSec = sensor.sleepTimeSec;
    });

    const boostIsActive = $derived(sensor.nextSleepTimeResetUnix * 1000 > Date.now());
    const boostRemainingFormatted = $derived(
        Duration.fromMillis(sensor.nextSleepTimeResetUnix * 1000 - Date.now()).toFormat(
            "mm'm'ss's'"
        )
    );

    const updateMetadata = async () => {
        try {
            await updateSensorMetadata({
                sensorName: sensor.sensorName,
                hexColor,
                tempOffset,
                sleepTimeSec
            });

            toast.push('<i class="fas fa-check"></i> Updated');

            const event = new CustomEvent('HomeTracker-RefreshData');
            document.dispatchEvent(event);
        } catch (error) {
            let errorMessage = (error as Error).message;
            const message = `<strong>Update failed</strong><br/> ${errorMessage}`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };

    const resetToDefaultSleepTime = async () => {
        sleepTimeSec = 596;
        await updateMetadata();
    };

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
</script>
```

- [ ] **Step 2: Update the template**

Replace everything between `</script>` and `<style>` with:

```svelte
<div class="container">
    <div>Color</div>
    <div>
        <input disabled={!$user} bind:value={hexColor} type="color" />
        <span>{hexColor}</span>
    </div>

    <div>Temperature offset</div>
    <input disabled={!$user} bind:value={tempOffset} type="number" />

    <div>Sleep time (s)</div>
    <span>
        <input disabled={!$user} bind:value={sleepTimeSec} type="number" />
        {Duration.fromMillis(sleepTimeSec * 1000).toFormat("mm'm'ss's'")}
        <button onclick={resetToDefaultSleepTime}>Reset</button>
        <button onclick={enableBoost}>Boost (2min/10min)</button>
    </span>

    <div>Default sleep time</div>
    <span>
        {sensor.sleepTimeSecDefault}s
        {Duration.fromMillis(sensor.sleepTimeSecDefault * 1000).toFormat("mm'm'ss's'")}
    </span>

    {#if boostIsActive}
        <div>Boost resets in</div>
        <span>{boostRemainingFormatted}</span>
    {/if}
</div>

{#if $user}
    <button class="update-button" onclick={updateMetadata}>Update</button>
{/if}
```

- [ ] **Step 3: Verify type-check passes**

Run from `front/`:

```bash
npm run check
```

Expected: no errors. Svelte-check validates template expressions including `sensor.sleepTimeSecDefault`, `boostIsActive`, `boostRemainingFormatted`.

- [ ] **Step 4: Commit**

```bash
git add front/src/routes/(apps)/home-tracker/components/SensorCard/Metadata.svelte
git commit -m "HomeTracker - Add boost display and Boost button to sensor metadata card"
```

---

## Task 3: Final verification

**Files:** none changed.

- [ ] **Step 1: Run lint**

Run from `front/`:

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 2: Run prettier**

Run from `front/`:

```bash
npm run prettier
```

Expected: `All matched files use Prettier code style!`
If not, run `npx prettier --write .` then re-run `npm run prettier`.

- [ ] **Step 3: Commit formatting fix if needed**

Only if prettier made changes:

```bash
git add -p   # stage only the formatting changes
git commit -m "HomeTracker - Format sensor boost UI files"
```

---

## Self-Review

- **Spec coverage:** `sleepTimeSecDefault` display ✓, `boostIsActive` countdown ✓, Boost button ✓, same visibility as Reset (no `{#if $user}`) ✓, API call in `api.ts` ✓, type update ✓.
- **No placeholders:** all steps contain complete code.
- **Type consistency:** `enableSensorBoost` exported in Task 1 Step 2, imported and used in Task 2 Step 1 under the same name. `boostIsActive` and `boostRemainingFormatted` defined and used in the same task.
