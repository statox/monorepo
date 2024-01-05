<script lang="ts">
    import InfoModal from './InfoModal.svelte';
    import { progressions, type Chord } from '$lib/Scales/progressions';
    import { degreeToRoman, notes } from '$lib/Scales/utils';
    import { openModal } from '$lib/components/Modal';

    export let scaleNotes: string[] = [];

    const formatChord = (chord: Chord) => {
        let roman = degreeToRoman(chord.degree);
        if (chord.minor) {
            roman = roman.toLowerCase();
        }
        if (chord.flat) {
            roman = 'b' + roman;
        }
        return roman;
    };

    const chordInScaleFromDegree = (chord: Chord) => {
        const scaleNote = scaleNotes[chord.degree - 1];
        let noteIndex = notes.indexOf(scaleNote);
        if (chord.flat) {
            noteIndex--;
            if (noteIndex === -1) {
                noteIndex = notes.length - 1;
            }
        }

        let note = notes[noteIndex];
        if (chord.minor) {
            note += 'm';
        }

        return note;
    };
</script>

<h3>
    Chord Progressions
    <span>
        <button style:position="relative" on:click={() => openModal(InfoModal)}>
            <i class="fa fa-info-circle" aria-hidden="true"></i>
        </button>
    </span>
</h3>

{#each progressions as progression}
    <div>
        <h4>{progression.name}</h4>
        {#if progression.examples}
            <span>
                <b>Examples:</b>
                {progression.examples.join(', ')}
            </span>
        {/if}
        <table>
            <tr>
                {#each progression.chords as chord}
                    <th>{formatChord(chord)}</th>
                {/each}
            </tr>
            <tr>
                {#each progression.chords as chord}
                    <td>{chordInScaleFromDegree(chord)}</td>
                {/each}
            </tr>
        </table>
    </div>
    <br />
{/each}

<style>
    th,
    td {
        text-align: center;
    }
</style>
