<script lang="ts">
    import { modals } from 'svelte-modals';
    import InfoModal from './InfoModal.svelte';
    import { progressions, type Chord } from '$lib/Scales/progressions';
    import { degreeToRoman, notes } from '$lib/Scales/utils';

    interface Props {
        scaleNotes?: string[];
    }

    let { scaleNotes = [] }: Props = $props();

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
        <button aria-label="info" style:position="relative" onclick={() => modals.open(InfoModal)}>
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
        <div class="progression-table">
            {#each progression.chords as chord}
                <div class="progression-step">
                    <div class="step-degree">{formatChord(chord)}</div>
                    <div class="step-value">{chordInScaleFromDegree(chord)}</div>
                </div>
            {/each}
        </div>
    </div>
    <br />
{/each}

<style>
    .progression-table {
        display: grid;
        row-gap: 1em;
        grid-template-columns: repeat(4, 25%);
        margin: 1em;
    }

    .step-degree {
        font-weight: bold;
        background: var(--nc-bg-3);
    }

    .step-degree,
    .step-value {
        text-align: center;
        width: 100%;
        border: 1px solid var(--nc-bg-3);
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
    }
</style>
