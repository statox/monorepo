<script lang="ts">
    import { TapTempo } from '$lib/TapTempo';

    interface Props {
        onNewBPM: (bpm: number) => void;
    }

    let { onNewBPM }: Props = $props();
    let tapTempo = new TapTempo();
    let taped = $state(false);

    const addBeat = () => {
        tapTempo.addBeat();
        taped = true;
        setTimeout(() => (taped = false), 100);

        if (tapTempo.bpm > 0) {
            onNewBPM(Math.ceil(tapTempo.bpm));
        }
    };
</script>

<div class="controls-container">
    <button class:taped onclick={addBeat}> Tap </button>
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
</style>
