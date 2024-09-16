<script lang="ts">
    import NotesOnInstrument from './components/NotesOnInstrument.svelte';
    import Progressions from './components/Progressions.svelte';
    import { degreeToRoman, notes } from '$lib/Scales/utils';
    import { pageNameStore } from '$lib/components/Header';

    pageNameStore.set('Scales');

    // https://hellomusictheory.com/learn/scale-degree-names/
    // https://ianring.com/musictheory/scales/

    type Interval = number;
    type TypeOfChord = 'major' | 'minor' | 'diminished';

    // Intervals a numbers of semitones
    type Scale = { name: string; intervals: Interval[]; chords: TypeOfChord[] };
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

    type Mode = { name: string; degree: number };
    const modes: Mode[] = [
        { name: 'Ionian', degree: 1 },
        { name: 'Dorian', degree: 2 },
        { name: 'Phrygian', degree: 3 },
        { name: 'Lydian', degree: 4 },
        { name: 'Mixolydian', degree: 5 },
        { name: 'Aeolian', degree: 6 },
        { name: 'Locrian', degree: 7 }
    ];

    let tonic = 'C';
    let scale = scales[0];
    let mode = modes[0];
    let scaleNotes: string[] = [];

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

    const formatDegreeName = (degree: number, chord: TypeOfChord) => {
        let roman = degreeToRoman(degree);
        if (chord === 'minor') {
            roman = roman.toLowerCase();
        } else if (chord === 'diminished') {
            roman += '°';
        }

        return roman;
    };

    const formatDegreeNote = (note: string, chord: TypeOfChord) => {
        let label = note;
        if (chord === 'minor') {
            label += 'm';
        } else if (chord === 'diminished') {
            label += '°';
        }

        return label;
    };

    $: getScale(tonic, scale, mode);
</script>

<table>
    <tr>
        <th>
            <label for="tonicInput">Tonic</label>
        </th>
        <th>
            <label for="scaleInput">Scale</label>
        </th>
        <th>
            <label for="modeInput">mode</label>
        </th>
    </tr>
    <tr>
        <td>
            <select id="tonicInput" bind:value={tonic}>
                {#each notes as note}
                    <option value={note}>
                        {note}
                    </option>
                {/each}
            </select>
        </td>

        <td>
            <select id="scaleInput" bind:value={scale}>
                {#each scales as scale}
                    <option value={scale}>
                        {scale.name}
                    </option>
                {/each}
            </select>
        </td>

        <td>
            <select id="modeInput" bind:value={mode}>
                {#each modes as mode}
                    <option value={mode}>
                        {mode.name}
                    </option>
                {/each}
            </select>
        </td>
    </tr>
</table>

<br />

<table>
    <tr>
        {#each scale.chords as chord, index}
            <th>{formatDegreeName(index + 1, chord)}</th>
        {/each}
    </tr>
    <tr>
        {#each scaleNotes as note, index}
            {@const type = scale.chords[index]}
            <td>{formatDegreeNote(note, type)}</td>
        {/each}
    </tr>
</table>

<NotesOnInstrument notesToDisplay={scaleNotes} />

{#if ['Major', 'Natural minor'].includes(scale.name)}
    {#key scaleNotes}
        <Progressions {scaleNotes} />
    {/key}
{/if}

<style>
    th,
    td {
        text-align: center;
    }
</style>
