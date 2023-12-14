<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { Metronome } from './Metronome';
    import { onDestroy, onMount } from 'svelte';
    import BeatsControls from './BeatsControls.svelte';
    import TempoControls from './TempoControls.svelte';
    import PlayPause from './PlayPause.svelte';

    let beatIsPlaying = false;
    let beatPlaying = 0;
    let subdivisionPlaying = 0;
    const onBeatStart = (beatNumber: number, subdivisionNumber: number) => {beatIsPlaying = true; beatPlaying = beatNumber, subdivisionPlaying = subdivisionNumber};
    const onBeatEnd = () => {beatIsPlaying = false};

    let metronome = new Metronome(80, onBeatStart, onBeatEnd);

    let _p5: p5;
    let beatItemColor = 'white';
    let beatTextColor = 'white';
    const sketch: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(600, 300);
            p5.textSize(40);
        };
        p5.draw = () => {
            const containerElement = document.getElementById('canvas-container');
            if (containerElement) {
                const containerWidth = containerElement?.clientWidth || 600;
                if (p5.width !== containerWidth) {
                    p5.resizeCanvas(containerWidth, Math.max(containerWidth/3, 100));
                }
            }

            p5.clear();

            p5.stroke(beatItemColor);
            const beatW = Math.min(p5.width / metronome.beatsPerBar, p5.height);
            const subdivisionH = p5.height / metronome.subdivisionsInBeat;

            for (let i=0; i<metronome.beatsPerBar; i++) {
                if (i === beatPlaying) {
                    p5.strokeWeight(3);
                } else {
                    p5.strokeWeight(1);
                }
                p5.noFill();
                p5.circle(i*beatW + beatW/2, p5.height/2, beatW * 0.9);
                p5.strokeWeight(1);
                // p5.noStroke();
                for (let j=0; j<metronome.subdivisionsInBeat; j++) {
                    if (beatIsPlaying && i === beatPlaying && j === subdivisionPlaying) {
                        p5.fill(beatItemColor);
                    } else {
                        p5.noFill();
                    }
                    p5.circle(i*beatW + beatW/2, j*subdivisionH + subdivisionH / 2, (beatW / metronome.subdivisionsInBeat) * 0.9);
                }
            }

            if (beatIsPlaying) {
                p5.fill(beatTextColor);
            } else {
                p5.fill(beatItemColor);
            }
            const beatPlayingStr = (beatPlaying+1).toString();
            p5.text(beatPlayingStr, beatPlaying*beatW + beatW / 2 - p5.textWidth(beatPlayingStr) / 2, p5.height / 2 + p5.textSize()/2);
        };
    };


    onMount(() => {
        const bodyStyle = getComputedStyle(document.body);

        beatItemColor = bodyStyle.getPropertyValue('--nc-tx-3');
        beatTextColor = bodyStyle.getPropertyValue('--nc-tx-2');
    });

    onDestroy(() => {
        _p5?.remove();
        metronome.stop();
    });
</script>

<div class="main">
    <h3>Metronome</h3>

    <PlayPause {metronome} />
    <TempoControls {metronome} />
    <BeatsControls {metronome} />

    <div id="canvas-container" class="d-flex justify-content-center">
        <P5 {sketch} />
    </div>
</div>


<style>
    .main {
        min-width: 300px;
    }
</style>
