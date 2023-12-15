<script lang="ts">
    import type { Metronome } from "../Metronome";

    export let metronome: Metronome;
</script>

<div class="tempo-container">
    <div class="tempo-less">
        <button on:click={() => metronome.tempo = Number(metronome.tempo) - 5}>-5</button>
        <button on:click={() => metronome.tempo = Number(metronome.tempo) - 1}>-1</button>
    </div>
    <div class="tempo-value" style="font-size: x-large">
        <input style="font-size: x-large; margin-right: 0.1em;" type="number" min="1" max="400" bind:value={metronome.tempo} /> BPM
    </div>
    <div class="tempo-more">
        <button on:click={() => metronome.tempo = Number(metronome.tempo) + 1}>+1</button>
        <button on:click={() => metronome.tempo = Number(metronome.tempo) + 5}>+5</button>
    </div>
</div>

<style>
    .tempo-container {
        display: flex;
        justify-content: space-evenly;
        flex-direction: row;
        margin: 1em;
    }
    .tempo-less {
        order: 1;
    }
    .tempo-value {
        order: 2;
    }
    .tempo-more {
        order: 3;
    }
    @media screen and (max-width: 500px) {
        .tempo-container {
            display: flex;
            justify-content: center;
            flex-direction: column;
            margin: 1em;
            gap: 1em;
        }
        .tempo-less {
            order: 2;
            display: flex;
            justify-content: space-evenly;
        }
        .tempo-value {
            order: 1;
            display: flex;
            justify-content: center;
        }
        .tempo-more {
            order: 3;
            display: flex;
            justify-content: space-evenly;
        }
    }
</style>
