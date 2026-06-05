<script lang="ts">
    import { degreeToRoman, notes, progressions, type Chord } from '$lib/Scales';

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

<div class="progressions">
    {#each progressions as progression}
        <div class="progression">
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
    {/each}
</div>

<style>
    .progressions {
        display: flex;
        flex-direction: column;
    }

    .progression {
        display: flex;
        flex-direction: column;
        justify-content: center;

        position: relative;
        padding-left: 20px;
    }

    .progression::before {
        content: '';
        position: absolute;
        left: 0;
        top: 10px; /* distance from top */
        bottom: 10px; /* distance from bottom */
        width: 1px;
        background-color: var(--nc-lk-1);
    }

    .progression-table {
        display: grid;
        grid-template-columns: repeat(4, 25%);

        width: 80%;
        margin: 2em auto;
        row-gap: 0;

        border: 1px solid var(--nc-tx-3);
    }

    .step-degree {
        font-weight: bold;
        background: var(--nc-bg-2);
    }

    .step-degree,
    .step-value {
        text-align: center;
        width: 100%;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
    }
    .step-value {
        border: 1px solid var(--nc-bg-3);
    }
</style>
