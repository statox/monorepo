<script lang="ts">
    import { Metronome } from '$lib/Metronome';
    import { onDestroy } from 'svelte';
    import { openModal } from '$lib/components/Modal';
    import BeatsControls from './components/BeatsControls.svelte';
    import TempoControls from './components/TempoControls.svelte';
    import PlayPause from './components/PlayPause.svelte';
    import MetronomeVisualization from './components/MetronomeVisualization.svelte';
    import Tap from './components/Tap.svelte';
    import InfoModal from './components/InfoModal.svelte';
    import { HeadIOS } from '$lib/components/HeadIOS';

    let metronome = new Metronome(80);

    onDestroy(() => {
        metronome.stop();
    });
</script>

<HeadIOS title="Metronome" description="Metronome" />

<div class="main">
    <h3>
        Metronome
        <span>
            <button style:position="relative" on:click={() => openModal(InfoModal)}>
                <i class="fa fa-info-circle" aria-hidden="true"></i>
            </button>
        </span>
    </h3>

    <div>
        <PlayPause {metronome} />
    </div>
    <div class="section">
        <TempoControls {metronome} />
        <Tap
            onNewBPM={(newBPM) => {
                metronome.tempo = newBPM / metronome.subdivisionsInBeat;
                metronome = metronome;
            }}
        />
    </div>
    <div class="section">
        <BeatsControls {metronome} />
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
