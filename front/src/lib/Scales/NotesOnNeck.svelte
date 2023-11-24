<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';
    import { notes } from './utils';

    let _p5: p5;

    export let notesToDisplay: string[];

    const stringsBase = ['E', 'A', 'D', 'G', 'B', 'E'];
    const NB_FRETS = 15;
    const strings = stringsBase.map(base => {
        const baseIndex = notes.indexOf(base);
        if (baseIndex === -1) {
            throw new Error(`Base ${base} not found`);
        }
        const string = [base];

        for (let fret=1; fret<NB_FRETS; fret++) {
            const note = notes[(baseIndex+fret) % notes.length];
            string.push(note);
        }
        return string;
    })

    const neckStartX = 30;
    const drawNeck = (p5: p5) => {
        const linesColor = [80, 70, 60, 150]
        const stringH = p5.height / 6;

        // Draw the strings
        for (let i=0; i<strings.length; i++) {
            const stringName = stringsBase[i];
            const stringY = stringH * i + stringH/2

            p5.strokeWeight(1);
            p5.stroke(linesColor);
            p5.noFill();
            p5.line(neckStartX, stringY, p5.width, stringY);

            p5.noStroke();
            p5.fill(linesColor)
            p5.text(stringName, 5, p5.height - stringY + p5.textSize() / 2);
        }


        // Draw the head of the neck
        p5.strokeWeight(5);
        p5.stroke(linesColor);
        p5.noFill();
        p5.line(neckStartX, stringH/2, neckStartX, p5.height - stringH / 2);

        // Draw the frets
        p5.strokeWeight(1);
        const fretW = p5.width / strings[0].length;
        for (let i=1; i<NB_FRETS; i++) {
            const fretX = neckStartX + fretW * i;
            p5.line(fretX, stringH/2, fretX, p5.height - stringH / 2);
        }

        // Draw simple guide points
        const simpleGuidesFrets = [3, 5, 7, 9, 15];
        for (const fret of simpleGuidesFrets) {
            let {x, y} = freetAreaScreenCoords({string: 2, fret});
            y -= stringH / 2;
            p5.fill(linesColor);
            p5.circle(x, y, 10);
        }

        // Draw double guide points
        const doubleGuideStrings = [1, 3];
        for (const string of doubleGuideStrings) {
            let {x, y} = freetAreaScreenCoords({string, fret: 12});
            y -= stringH / 2;
            p5.fill(linesColor);
            p5.circle(x, y, 10);
        }
    };

    const drawNotes = (p5: p5) => {
        for (let i=0; i<6; i++) {
            const string = strings[i];
            for (let j=0; j<string.length; j++) {
                const note = string[j];
                if (!notesToDisplay.includes(note)) {
                    continue;
                }

                const area = { string: i, fret: j};
                const {x, y} = freetAreaScreenCoords(area);

                if (notesToDisplay.indexOf(note) === 0) {
                    p5.fill([250, 80, 80]);
                } else {
                    p5.fill('black');
                }
                p5.circle(x, y, 20);

                p5.noStroke();
                p5.fill('white');
                p5.text(note, x - p5.textWidth(note) / 2, y + p5.textSize() / 2);
            }
        }
    };


    type FretArea = {
        string: number; // 0: E, 1: A, 2: D, ...
        fret: number;   // 0: open string, 1: 1st case, ...
    }
    const freetAreaScreenCoords = (freatArea: FretArea): {x: number, y: number} => {
        const {string, fret} = freatArea;
        const stringH = _p5.height / 6;
        const y = stringH * (5-string) + stringH/2

        if (fret === 0) {
            return {
                x: neckStartX,
                y
            }
        }

        const fretW = _p5.width / strings[0].length;
        const x = neckStartX + fretW * (fret-1) + fretW * 0.5;

        return {x, y};
    }

    const sketch: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(900, 300);
        };
        p5.draw = () => {
            p5.background([200, 190, 170]);
            drawNeck(p5);
            drawNotes(p5);
        };
    };

    onDestroy(() => {
        _p5?.remove();
    });
</script>

<div class="d-flex justify-content-center">
    <P5 {sketch} />
</div>
