<script lang="ts">
    import { user } from '$lib/auth';
    import { toast } from '$lib/components/Toast';
    import type { SensorMetadata } from '$lib/HomeTracker';
    import { enableSensorBoost, updateSensorMetadata } from '$lib/HomeTracker';
    import { Duration } from 'luxon';
    import { onDestroy } from 'svelte';

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

    let nowMs = $state(Date.now());
    const nowMsInterval = setInterval(() => {
        nowMs = Date.now();
    }, 1000);
    onDestroy(() => clearInterval(nowMsInterval));

    const boostIsActive = $derived(sensor.nextSleepTimeResetUnix * 1000 > nowMs);
    const boostRemainingFormatted = $derived(
        Duration.fromMillis(sensor.nextSleepTimeResetUnix * 1000 - nowMs).toFormat("mm'm'ss's'")
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
        sleepTimeSec = sensor.sleepTimeSecDefault;
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

<style>
    .container {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-column-gap: 10px;
    }

    .update-button {
        margin-top: 1em;
    }
</style>
