<script lang="ts">
    import { ButtonSwitch } from '$lib/components/ButtonSwitch';
    import { localStore } from '$lib/localStore.svelte';
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';

    let _p5: p5 | undefined = $state();

    const screenSize = 1000;
    let t = 0;
    let lastTs = 0;
    let framesSinceLastTs = 0;
    let fps = $state(0);

    // Controls
    const gridSize = localStore('p5-terrain-gridSize', 200);
    let cellSize = screenSize / gridSize.value;
    $effect(() => {
        cellSize = screenSize / gridSize.value;
    });
    let blurEnabled = localStore('p5-terrain-blurEnabled', false);
    let blurValue = localStore('p5-terrain-blurValue', 4);

    // Noise controls
    let displacementX = localStore('p5-terrain-displacementX', 0);
    let displacementY = localStore('p5-terrain-displacementY', 0);
    let displacementZ = localStore('p5-terrain-displacementZ', 0.01);
    let noiseFactor = localStore('p5-terrain-noiseFactor', 0.02);

    // lines controls
    let levelsStart = localStore('p5-terrain-levelsStart', 0.2);
    let levelsEnd = localStore('p5-terrain-levelsEnd', 0.8);
    let levelsStep = localStore('p5-terrain-levelsStep', 0.05);
    let levelsMargin = localStore('p5-terrain-margin', 0.005);

    type ColorMode = 'white' | 'gradient';
    let colorMode = localStore<ColorMode>('p5-terrain-colorMode', 'gradient');

    const resetAllControls = () => {
        const controls = [
            gridSize,
            blurEnabled,
            blurValue,

            displacementX,
            displacementY,
            displacementZ,
            noiseFactor,

            levelsStart,
            levelsEnd,
            levelsStep,
            levelsMargin,
            colorMode
        ];

        controls.forEach((c) => c.reset());
    };

    const equalWithMargin = (value: number, target: number, margin: number) => {
        return target - margin <= value && value <= target + margin;
    };

    const sketch: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(screenSize, screenSize);
            p5.noStroke();
        };

        p5.draw = () => {
            p5.background(0);

            const now = Date.now();
            const diff = now - lastTs;
            if (diff > 1000) {
                fps = framesSinceLastTs;
                lastTs = now;
                framesSinceLastTs = 0;
            }
            framesSinceLastTs++;

            t++;

            for (let y = 0; y < gridSize.value; y++) {
                for (let x = 0; x < gridSize.value; x++) {
                    const v = p5.noise(
                        x * noiseFactor.value + t * displacementX.value,
                        y * noiseFactor.value + t * displacementY.value,
                        t * displacementZ.value
                    );

                    for (
                        let threshold = levelsStart.value;
                        threshold <= levelsEnd.value;
                        threshold += levelsStep.value
                    ) {
                        if (!equalWithMargin(v, threshold, levelsMargin.value)) {
                            continue;
                        }
                        let color = 255;
                        if (colorMode.value === 'white') {
                            color = 255;
                        } else if (colorMode.value === 'gradient') {
                            color = p5.map(threshold, levelsStart.value, levelsEnd.value, 100, 255);
                        }

                        p5.fill(color);
                        p5.circle(x * cellSize, y * cellSize, cellSize);
                    }
                }
            }

            if (blurEnabled.value) {
                p5.filter(p5.BLUR, blurValue.value);
            }
        };
    };

    onDestroy(() => {
        _p5?.remove();
    });

    let enableBlur = $state(blurEnabled.value ? 'on' : 'off');
</script>

<div class="container">
    <P5 {sketch} />
    <div class="controls">
        <label for="fps">FPS</label>
        <span>{fps}</span>

        <span>Grid controls</span><span></span>
        <label for="gridSize">gridSize</label>
        <input type="number" step="1" bind:value={gridSize.value} />

        <label for="blurEnabled">Enable blur</label>
        <ButtonSwitch
            value={enableBlur}
            label=""
            on:change={() => {
                blurEnabled.value = !blurEnabled.value;
                enableBlur = blurEnabled.value ? 'on' : 'off';
            }}
            design="slider"
        />

        {#if blurEnabled.value}
            <label for="blurValue">Blur value (default 4)</label>
            <input type="number" step="1" bind:value={blurValue.value} />
        {/if}

        <span>Noise controls</span><span></span>
        <label for="displacementX">displacementX</label>
        <input type="number" step="0.01" bind:value={displacementX.value} />

        <label for="displacementY">displacementY</label>
        <input type="number" step="0.01" bind:value={displacementY.value} />

        <label for="displacementZ">displacementZ</label>
        <input type="number" step="0.01" bind:value={displacementZ.value} />

        <label for="noiseFactor">noiseFactor</label>
        <input type="number" step="0.01" bind:value={noiseFactor.value} />

        <span>Lines controls</span><span></span>
        <label for="levelsStart">levelsStart</label>
        <input type="number" step="0.1" bind:value={levelsStart.value} />

        <label for="levelsEnd">levelsEnd</label>
        <input type="number" step="0.1" bind:value={levelsEnd.value} />

        <label for="levelsStep">levelsStep</label>
        <input type="number" step="0.001" bind:value={levelsStep.value} />

        <label for="levelsMargin">levelsMargin</label>
        <input type="number" step="0.001" bind:value={levelsMargin.value} />

        <label for="colorMode">colorMode</label>
        <select id="colorMode-select" bind:value={colorMode.value}>
            <option value="white">White</option>
            <option value="gradient">Gradient</option>
        </select>

        <label for="resetAll">Reset all</label><button onclick={resetAllControls}>Reset</button>
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-direction: row;
    }
    .controls {
        display: grid;
        grid-template-columns: auto auto;
        grid-auto-rows: 2rem;
        align-items: start;
    }
</style>
