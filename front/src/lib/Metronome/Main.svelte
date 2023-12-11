<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { Metronome } from './Metronome';
    import { onDestroy, onMount } from 'svelte';

    let beatIsPlaying = false;
    let beatPlaying = 0;
    const onBeatStart = (beatNumber: number) => {beatIsPlaying = true; beatPlaying = beatNumber};
    const onBeatEnd = () => {beatIsPlaying = false};

    let metronome = new Metronome(80, onBeatStart, onBeatEnd);

    const onKeyDown = (e: KeyboardEvent) => {
        const SPACE = ' ';
        const allowedKeys = [SPACE];
        if (!allowedKeys.includes(e.key)) {
            return;
        }
        e.preventDefault();
        if (e.key === SPACE) {
            metronomeStartStop();
            return;
        }
    };

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

            for (let i=0; i<metronome.beatsPerBar; i++) {
                if (beatIsPlaying && i === beatPlaying) {
                    p5.fill(beatItemColor);
                } else {
                    p5.noFill();
                }
                p5.circle(i*beatW + beatW/2, p5.height/2, beatW * 0.9);
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

    const updateTempo = (diff: number) => {
        metronome.tempo = Number(metronome.tempo) + diff;
    };

    const metronomeStartStop = () => {
        metronome.startStop();
        metronome = metronome;
    }

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

<h3>Metronome</h3>

<div>
    <button on:click={metronomeStartStop}>
        {metronome.isRunning ? 'Pause' : 'Play'}
    </button>
</div>

<div>
    <button on:click={() => updateTempo(-5)}>-5</button>
    <button on:click={() => updateTempo(-1)}>-1</button>
    <label for="tempo">Tempo:</label> <input type="number" min="1" max="400" bind:value={metronome.tempo} />
    <button on:click={() => updateTempo(1)}>+1</button>
    <button on:click={() => updateTempo(5)}>+5</button>
</div>

<div>
    <label for="beatsInBar">Beats in bar</label>
    <select bind:value={metronome.beatsPerBar}>
        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as beatsPerBar}
            <option value={beatsPerBar}>
                {beatsPerBar}
            </option>
        {/each}
    </select>
</div>

<div id="canvas-container" class="d-flex justify-content-center">
    <P5 {sketch} />
</div>

<svelte:window on:keydown={onKeyDown} />
