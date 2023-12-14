<script lang="ts">
    import { Metronome } from './Metronome';
    import { onDestroy } from 'svelte';
    import BeatsControls from './BeatsControls.svelte';
    import TempoControls from './TempoControls.svelte';
    import PlayPause from './PlayPause.svelte';
    import MetronomeVisualization from './MetronomeVisualization.svelte';

    let metronome = new Metronome(80);

    onDestroy(() => {
        metronome.stop();
    });
</script>

<div class="main">
    <h3>Metronome</h3>

    <PlayPause {metronome} />
    <TempoControls {metronome} />
    <BeatsControls {metronome} />
    <MetronomeVisualization {metronome} />
</div>


<style>
    .main {
        min-width: 300px;
    }
</style>
