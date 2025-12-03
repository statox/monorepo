<script lang="ts">
    import { Metronome } from '$lib/Metronome';
    import { onDestroy } from 'svelte';
    import { modals } from 'svelte-modals';
    import BeatsControls from './components/BeatsControls.svelte';
    import TempoControls from './components/TempoControls.svelte';
    import PlayPause from './components/PlayPause.svelte';
    import MetronomeVisualization from './components/MetronomeVisualization.svelte';
    import Tap from './components/Tap.svelte';
    import InfoModal from './components/InfoModal.svelte';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageMetadataStore } from '$lib/components/Header';

    pageMetadataStore.set({ name: 'Metronome' });

    let metronome = new Metronome(80);
    // We use reactive values outside of the metronome object to avoid having
    // to create $state properties directly in the class
    let tempo = $state(metronome.tempo);
    let beatsPerBar = $state(metronome.beatsPerBar);
    let subdivisionsInBeat = $state(metronome.subdivisionsInBeat);

    onDestroy(() => {
        metronome.stop();
    });

    const onTempoUpdate = (newTempo: number) => {
        tempo = newTempo;
        metronome.tempo = newTempo;
    };

    const onBeatsPerBarUpdate = (newBeatsPerBar: number) => {
        beatsPerBar = newBeatsPerBar;
        metronome.beatsPerBar = newBeatsPerBar;
    };

    const onSubdivisionsInBeatUpdate = (newSubdivisionsInBeat: number) => {
        subdivisionsInBeat = newSubdivisionsInBeat;
        metronome.subdivisionsInBeat = newSubdivisionsInBeat;
    };
</script>

<HeadIOS title="Metronome" description="Metronome" />

<div class="main">
    <h3>
        Metronome
        <span>
            <button
                aria-label="info"
                style:position="relative"
                onclick={() => modals.open(InfoModal)}
            >
                <i class="fa fa-info-circle" aria-hidden="true"></i>
            </button>
        </span>
    </h3>

    <div>
        <PlayPause {metronome} />
    </div>
    <div class="section">
        <TempoControls bind:tempo {onTempoUpdate} />
        <Tap onNewBPM={(newBPM) => onTempoUpdate(newBPM / metronome.subdivisionsInBeat)} />
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
    .main {
        min-width: 300px;
    }
    .section {
        min-width: 300px;
        margin: 1em;
        border: 1px solid var(--nc-bg-3);
    }
</style>
