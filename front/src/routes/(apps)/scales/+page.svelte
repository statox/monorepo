<script lang="ts">
    import { onMount } from 'svelte';
    import { notes } from '$lib/Scales';
    import { pageMetadataStore } from '$lib/components/Header';
    import NotesOnInstrument from './components/NotesOnInstrument.svelte';
    import Progressions from './components/Progressions.svelte';
    import InfoPanel from './components/InfoPanel.svelte';
    import ScaleSelector from './components/ScaleSelector.svelte';
    import type { Scale, Mode } from './components/ScaleSelector.svelte';

    pageMetadataStore.set({ name: 'Scales' });

    // https://hellomusictheory.com/learn/scale-degree-names/
    // https://ianring.com/musictheory/scales/

    // Intervals as numbers of semitones
    const scales: Scale[] = [
        {
            name: 'Major',
            intervals: [2, 2, 1, 2, 2, 2, 1],
            chords: ['major', 'minor', 'minor', 'diminished', 'major', 'minor', 'major']
        },
        {
            name: 'Natural minor',
            intervals: [2, 1, 2, 2, 1, 2, 2],
            chords: ['minor', 'diminished', 'major', 'minor', 'major', 'major', 'minor']
        },
        {
            name: 'Pentatonic major',
            intervals: [2, 2, 3, 2, 3],
            chords: ['major', 'minor', 'minor', 'major', 'minor']
        },
        {
            name: 'Pentatonic minor',
            intervals: [3, 2, 2, 3, 2],
            chords: ['minor', 'major', 'minor', 'major', 'major']
        }
    ];

    const modes: Mode[] = [
        { name: 'Ionian', degree: 1 },
        { name: 'Dorian', degree: 2 },
        { name: 'Phrygian', degree: 3 },
        { name: 'Lydian', degree: 4 },
        { name: 'Mixolydian', degree: 5 },
        { name: 'Aeolian', degree: 6 },
        { name: 'Locrian', degree: 7 }
    ];

    let tonic = $state('C');
    let scale = $state(scales[0]);
    let mode = $state(modes[0]);
    let scaleNotes: string[] = $state([]);

    const getScale = (tonic: string, scale: Scale, mode: Mode) => {
        const { intervals } = scale;
        scaleNotes = [tonic];

        const tonicIndex = notes.indexOf(tonic);
        if (tonicIndex === -1) {
            throw new Error(`Tonic ${tonic} not found`);
        }

        let index = tonicIndex;
        for (const interval of intervals) {
            index = (index + interval) % notes.length;
            scaleNotes.push(notes[index]);
        }

        // Remove the tonic from the last position
        scaleNotes.pop();

        for (let i = 1; i < mode.degree; i++) {
            scaleNotes.push(scaleNotes.shift()!);
        }
    };

    onMount(() => getScale(tonic, scale, mode));
</script>

<div class="container">
    <InfoPanel />

    <ScaleSelector
        bind:tonic
        bind:scale
        bind:mode
        {scales}
        {modes}
        {scaleNotes}
        onchange={getScale}
    />

    <NotesOnInstrument notesToDisplay={scaleNotes} />

    {#if ['Major', 'Natural minor'].includes(scale.name)}
        {#key scaleNotes}
            <Progressions {scaleNotes} />
        {/key}
    {/if}
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        max-width: 900px;
    }
    @media screen and (min-width: 900px) {
        .container {
            margin: 0 auto;
        }
    }
</style>
