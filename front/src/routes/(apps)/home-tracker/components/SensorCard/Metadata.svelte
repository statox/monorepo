<script lang="ts">
    import { user } from '$lib/auth/service';
    import type { SensorMetadata } from '$lib/HomeTracker';

    interface Props {
        sensor: SensorMetadata;
    }

    let { sensor }: Props = $props();
    let hexColor = $state(sensor.hexColor);
    let tempOffset = $state(sensor.tempOffset);
    let sleepTimeSec = $state(sensor.sleepTimeSec);
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
    <input disabled={!$user} bind:value={sleepTimeSec} type="number" />
</div>

{#if $user}
    <button class="update-button">Update</button>
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
