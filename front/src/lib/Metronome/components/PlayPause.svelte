<script lang="ts">
    import type { Metronome } from "../Metronome";

    export let metronome: Metronome;

    const metronomeStartStop = () => {
        metronome.startStop();
        metronome = metronome;
    }

    const onKeyDown = (e: KeyboardEvent) => {
        const SPACE = ' ';
        const allowedKeys = [SPACE];
        if (!allowedKeys.includes(e.key)) {
            return;
        }
        e.preventDefault();
        if (e.key === SPACE) {
            metronomeStartStop();
            return;
        }
    };
</script>

<div class="controls-container">
    <button style="min-width: 300px" on:click={metronomeStartStop}>
        {#if metronome.isRunning}
            <svg width="20" height="20" fill="blue" xmlns="http://www.w3.org/2000/svg" style="width: 20px; height: auto;"><path d="M 0 0 V 20 L 6 20 L 6 0 L 0 0 M 9 0 V 20 H 15 V 0 H 9"></path></svg>
        {:else}
            <svg width="20" height="20" fill="blue" xmlns="http://www.w3.org/2000/svg" style="width: 20px; height: auto;"><path d="M 0 0 V 20 L 17 10"></path></svg>
        {/if}
    </button>
</div>

<svelte:window on:keydown={onKeyDown} />

<style>
    .controls-container {
        display: flex;
        margin: 1em;

        flex-direction: column;
        justify-content: space-evenly;
    }
</style>
