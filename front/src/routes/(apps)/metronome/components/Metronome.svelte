<script lang="ts">
    import { Metronome } from '$lib/Metronome';
    import { onDestroy } from 'svelte';
    import BeatsControls from './BeatsControls.svelte';
    import TempoControls from './TempoControls.svelte';
    import PlayPause from './PlayPause.svelte';
    import MetronomeVisualization from './MetronomeVisualization.svelte';
    import Tap from './Tap.svelte';

    let metronome = new Metronome(80);
    // We use reactive values outside of the metronome object to avoid having
    // to create $state properties directly in the class
    let tempo = $state(metronome.tempo);
    let beatsPerBar = $state(metronome.beatsPerBar);
    let subdivisionsInBeat = $state(metronome.subdivisionsInBeat);

    // Sync state with metronome object
    $effect(() => {
        metronome.tempo = tempo;
    });

    $effect(() => {
        metronome.beatsPerBar = beatsPerBar;
    });

    $effect(() => {
        metronome.subdivisionsInBeat = subdivisionsInBeat;
    });

    onDestroy(() => {
        metronome.stop();
    });

    const onBeatsPerBarUpdate = (newBeatsPerBar: number) => {
        beatsPerBar = newBeatsPerBar;
        metronome.beatsPerBar = newBeatsPerBar;
    };

    const onSubdivisionsInBeatUpdate = (newSubdivisionsInBeat: number) => {
        subdivisionsInBeat = newSubdivisionsInBeat;
        metronome.subdivisionsInBeat = newSubdivisionsInBeat;
    };
</script>

<div class="container">
    <div>
        <PlayPause {metronome} />
    </div>
    <div class="section">
        <TempoControls bind:tempo />
        <Tap onNewBPM={(newBPM) => (tempo = newBPM / metronome.subdivisionsInBeat)} />
    </div>
    <div class="section">
        <BeatsControls
            bind:beatsPerBar
            bind:subdivisionsInBeat
            {onBeatsPerBarUpdate}
            {onSubdivisionsInBeatUpdate}
        />
    </div>
    <div class="section">
        <MetronomeVisualization {metronome} />
    </div>
</div>

<style>
    .container {
        width: 600px;
    }
    .section {
        margin: 1em;
        border: 1px solid var(--nc-bg-3);
    }
</style>
