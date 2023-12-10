<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';
    import { degreeToRoman, notes } from './utils';

    let _p5: p5;
    type LabelMode = 'name' | 'degree';
    export let labelMode: LabelMode = 'name';

    export let notesToDisplay: string[];

    const fullKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const halfKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];
    const NB_FULL_KEYS = 14;

    const drawBoard = (p5: p5) => {
        const linesColor = [80, 70, 60, 150];
        const halfKeyColor = [80, 70, 60];
        const fullKeyW = p5.width / NB_FULL_KEYS;

        for (let i = 0; i < NB_FULL_KEYS; i++) {
            const note = fullKeys[i % fullKeys.length];
            p5.strokeWeight(1);
            p5.stroke(linesColor);
            p5.noFill();

            // Draw the full notes
            p5.rect(fullKeyW * i, 0, fullKeyW, p5.height);

            const halfKey = note + '#';
            if (halfKeys.includes(halfKey)) {
                p5.fill(halfKeyColor);
                p5.rect(fullKeyW * i + (2 * fullKeyW) / 3, 0, fullKeyW / 2, p5.height * 0.65);
            }
        }
    };

    const getNoteName = (notes: string[], note: string, mode: 'name' | 'degree') => {
        if (mode === 'name') {
            return note;
        }
        const index = notes.indexOf(note);
        if (index === -1) {
            throw new Error('note not in scale');
        }

        return degreeToRoman(index + 1);
    };

    const drawNotes = (p5: p5) => {
        const fullKeyW = p5.width / NB_FULL_KEYS;
        for (let i = 0; i < NB_FULL_KEYS; i++) {
            const note = fullKeys[i % fullKeys.length];

            const noteIndex = notesToDisplay.indexOf(note);
            if (noteIndex >= 0) {
                if (noteIndex === 0) {
                    p5.fill([250, 80, 80]);
                } else {
                    p5.fill('black');
                }

                const x = fullKeyW * i + fullKeyW / 2;
                const y = p5.height * 0.8;
                p5.circle(x, y, 20);

                p5.noStroke();
                p5.fill('white');
                const label = getNoteName(notesToDisplay, note, labelMode);
                p5.text(label, x - p5.textWidth(label) / 2, y + p5.textSize() / 2);
            }

            const sharpNote = note + '#';
            const sharpNoteIndex = notesToDisplay.indexOf(sharpNote);
            if (sharpNoteIndex >= 0) {
                if (sharpNoteIndex === 0) {
                    p5.fill([250, 80, 80]);
                } else {
                    p5.fill('black');
                }

                const x = fullKeyW * i + fullKeyW;
                const y = p5.height * 0.5;
                p5.circle(x, y, 20);

                p5.noStroke();
                p5.fill('white');
                const label = getNoteName(notesToDisplay, sharpNote, labelMode);
                p5.text(label, x - p5.textWidth(label) / 2, y + p5.textSize() / 2);
            }
        }
    };

    const sketch: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(900, 300);
            p5.textStyle(p5.BOLD);
        };
        p5.draw = () => {
            p5.background([200, 190, 170]);
            drawBoard(p5);
            drawNotes(p5);
            p5.noLoop();
        };
    };

    // Re run draw() when notesToDisplay change
    $: if (notesToDisplay || labelMode) _p5?.draw();

    onDestroy(() => {
        _p5?.remove();
    });
</script>

<div class="d-flex justify-content-center">
    <P5 {sketch} />
</div>
