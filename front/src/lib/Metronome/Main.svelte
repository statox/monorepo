<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { Metronome } from './Metronome';
    import { onDestroy, onMount } from 'svelte';

    let beatIsPlaying = false;
    let beatPlaying = 0;
    let subdivisionPlaying = 0;
    const onBeatStart = (beatNumber: number, subdivisionNumber: number) => {beatIsPlaying = true; beatPlaying = beatNumber, subdivisionPlaying = subdivisionNumber};
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

<div class="main">
    <h3>Metronome</h3>

    <div class="controls-container">
        <button style="min-width: 300px" on:click={metronomeStartStop}>
            {metronome.isRunning ? 'Pause' : 'Play'}
        </button>
    </div>

    <div class="tempo-container">
        <div class="tempo-less">
            <button on:click={() => metronome.tempo = Number(metronome.tempo) - 5}>-5</button>
            <button on:click={() => metronome.tempo = Number(metronome.tempo) - 1}>-1</button>
        </div>
        <div class="tempo-value">
            <input style="font-size: x-large" type="number" min="1" max="400" bind:value={metronome.tempo} /> BPM
        </div>
        <div class="tempo-more">
            <button on:click={() => metronome.tempo = Number(metronome.tempo) + 1}>+1</button>
            <button on:click={() => metronome.tempo = Number(metronome.tempo) + 5}>+5</button>
        </div>
    </div>

    <div class="controls-container">
        <div class="controls-sub-container">
            <label for="beatsInBar"><h4>Beats in bar</h4></label>
            <div class="subdivisions-container">
                <button on:click={() => metronome.beatsPerBar = Math.max(metronome.beatsPerBar-1, 1)}>-1</button>
                <span style="font-size: large; margin-left: 1em; margin-right: 1em">{metronome.beatsPerBar}</span>
                <button on:click={() => metronome.beatsPerBar = Math.min(metronome.beatsPerBar+1, 10)}>+1</button>
            </div>
        </div>
        <br/>

        <div class="controls-sub-container">
            <label for="subdivisionsInBeat"><h4>Subdivisions in beat<h4></label>

            <div class="subdivisions-container">
                <button class:selected={metronome.subdivisionsInBeat===1} on:click={() => metronome.subdivisionsInBeat=1}>
                    <svg width="15" height="15" fill="blue" xmlns="http://www.w3.org/2000/svg" style="width: 15px; height: auto;"><path d="M 4.3 0 v 9.6 A 2.9 2.9 0 0 0 0 12.1 A 3 3 0 0 0 3 15 c 1.5 0 2.8 -1.3 2.8 -2.9 V 3 V 0 H 4.3 Z"></path></svg>
                </button>
                <button  class:selected={metronome.subdivisionsInBeat===2} on:click={() => metronome.subdivisionsInBeat=2}>
                    <svg width="15" height="15" fill="blue" xmlns="http://www.w3.org/2000/svg" style="width: 15px; height: auto;"><path d="M4.3 0v9.6A2.9 2.9 0 0 0 0 12.1 3 3 0 0 0 3 15c1.5 0 2.8-1.3 2.8-2.9V3h7.7v6.6a2.9 2.9 0 0 0-4.3 2.5 2.9 2.9 0 0 0 5.8 0V0H4.3Z"></path></svg>
                </button>
                <button class:selected={metronome.subdivisionsInBeat===3} on:click={() => metronome.subdivisionsInBeat=3}>
                    <svg width="24" height="21" fill="blue" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: auto; top: -3px;"><path clip-rule="evenodd" d="M4.3 15.6V6H24v12.1a3 3 0 0 1-3 2.9 2.9 2.9 0 0 1-2.8-2.9 2.9 2.9 0 0 1 4.3-2.5V9H15v9.1a2.9 2.9 0 0 1-3 2.9 3 3 0 0 1-3-2.9 2.9 2.9 0 0 1 3-2.8c.5 0 1 0 1.3.3V9H5.8v9.1C5.8 19.7 4.5 21 3 21a3 3 0 0 1-3-2.9 2.9 2.9 0 0 1 4.3-2.5Z"></path><path d="M12.6 2.2 13.9.5V0h-3.1v.4h2.5l-1.4 1.7v.4h.4c.9 0 1.3.4 1.3 1s-.4 1-1.2 1c-.7 0-1.3-.3-1.6-.6l-.2.4c.4.4 1 .6 1.8.6 1.1 0 1.7-.6 1.7-1.4 0-.8-.5-1.3-1.5-1.4Z"></path></svg>
                </button>
                <button class:selected={metronome.subdivisionsInBeat===4} on:click={() => metronome.subdivisionsInBeat=4}>
                    <svg width="27" height="13" fill="blue" xmlns="http://www.w3.org/2000/svg" style="width: 27px; height: auto;"><path clip-rule="evenodd" d="M3.5 0v7.9a2 2 0 0 0-1.1-.3C1 7.6 0 8.6 0 9.9c0 1.3 1 2.4 2.4 2.4 1.3 0 2.3-1 2.3-2.4V3.4H11V8a2 2 0 0 0-1.1-.3 2.3 2.3 0 1 0 0 4.7c1.3 0 2.4-1 2.4-2.4V3.4h6.1V8a2.4 2.4 0 0 0-1-.3c-1.4 0-2.5 1-2.5 2.3 0 1.3 1.1 2.4 2.4 2.4 1.3 0 2.4-1 2.4-2.4V3.4h6.2V8l-1.2-.3c-1.3 0-2.3 1-2.3 2.3a2.3 2.3 0 1 0 4.7 0V0H3.5Zm7.4 2.7H4.7V1.5H11v1.2Zm7.4 0h-6.1V1.5h6.1v1.2Zm1.3 0h6.2V1.5h-6.2v1.2Z"></path></svg>
                </button>
            </div>
        </div>
    </div>

    <div id="canvas-container" class="d-flex justify-content-center">
        <P5 {sketch} />
    </div>

</div>

<svelte:window on:keydown={onKeyDown} />

<style>
    .main {
        min-width: 300px;
    }
    button.selected {
        background: var(--nc-lk-2);
    }

    .tempo-container {
        display: flex;
        justify-content: space-evenly;
        flex-direction: row;
        margin: 1em;
    }
    .tempo-less {
        order: 1;
    }
    .tempo-value {
        order: 2;
    }
    .tempo-more {
        order: 3;
    }
    @media screen and (max-width: 500px) {
        .tempo-container {
            display: flex;
            justify-content: center;
            flex-direction: column;
            margin: 1em;
            gap: 1em;
        }
        .tempo-less {
            order: 2;
            display: flex;
            justify-content: space-evenly;
        }
        .tempo-value {
            order: 1;
            display: flex;
            justify-content: center;
        }
        .tempo-more {
            order: 3;
            display: flex;
            justify-content: space-evenly;
        }
    }


    .subdivisions-container {
        display: flex;
        justify-content: space-evenly;
        gap: 0.1em;
        flex-wrap: wrap;
    }

    .controls-container {
        display: flex;
        margin: 1em;
    }
    .controls-sub-container {
        display: flex;
    }
    @media screen and (max-width: 500px) {
        .controls-container {
            flex-direction: column;
        }
        .controls-sub-container {
            flex-direction: column;
            justify-content: space-between;
        }
    }
    @media screen and (min-width:500px) and (max-width: 700px) {
        .controls-container {
            flex-direction: column;
            justify-content: space-evenly;
        }
        .controls-sub-container {
            flex-direction: row;
            justify-content: space-between;
        }
    }
    @media screen and (min-width: 700px) {
        .controls-container {
            flex-direction: row;
            justify-content: space-around;
        }
        .controls-sub-container {
            flex-direction: column;
            justify-content: space-around;
        }
    }

</style>
