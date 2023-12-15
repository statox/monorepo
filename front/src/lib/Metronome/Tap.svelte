<script lang="ts">
    import { TapTempo } from "$lib/TapTempo/TapTempo";

    export let onNewBPM: (bpm: number) => void;
    let tapTempo = new TapTempo();
    let taped = false;

    const addBeat = () => {
        tapTempo.addBeat();
        taped = true;
        setTimeout(() => (taped = false), 100);

        onNewBPM(tapTempo.bpm);
    };
</script>

<div class="controls-container">
    <button class:taped style="min-width: 300px" on:click={addBeat}>
        Tap
    </button>
</div>

<style>
    button:hover {
        background: var(--nc-lk-1);
    }
    button.taped {
        background: var(--nc-lk-2);
    }
    .controls-container {
        display: flex;
        margin: 1em;

        flex-direction: column;
        justify-content: space-evenly;
    }
    @media screen and (min-width: 700px) {
        .controls-container {
            flex-direction: row;
            justify-content: space-around;
        }
    }
</style>
