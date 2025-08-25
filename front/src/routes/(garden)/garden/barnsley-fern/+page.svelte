<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';

    let _p5: p5;

    const MAX_NB_POINTS = 1000000;
    let nbPoints = $state(0);
    let fps = $state(0);
    let frameInLastSecond = 0;
    let fpsUpdateTimeout: ReturnType<typeof setTimeout> | undefined;

    interface FunctionCoefs {
        a: number;
        b: number;
        c: number;
        d: number;
        e: number;
        f: number;
        p: number;
    }
    interface Coefs {
        f1: FunctionCoefs;
        f2: FunctionCoefs;
        f3: FunctionCoefs;
        f4: FunctionCoefs;
    }

    const originalCoefs = {
        f1: {
            a: 0,
            b: 0,
            c: 0,
            d: 0.16,
            e: 0,
            f: 0,
            p: 0.01
        },
        f2: {
            a: 0.85,
            b: 0.04,
            c: -0.04,
            d: 0.85,
            e: 0,
            f: 1.6,
            p: 0.85
        },
        f3: {
            a: 0.2,
            b: -0.26,
            c: 0.23,
            d: 0.22,
            e: 0,
            f: 1.6,
            p: 0.07
        },
        f4: {
            a: -0.15,
            b: 0.28,
            c: 0.26,
            d: 0.24,
            e: 0,
            f: 0.44,
            p: 0.07
        }
    };

    const mutantCoefs = {
        f1: {
            a: 0,
            b: 0,
            c: 0,
            d: 0.25,
            e: 0,
            f: -0.4,
            p: 0.02
        },
        f2: {
            a: 0.95,
            b: 0.005,
            c: -0.005,
            d: 0.93,
            e: -0.002,
            f: 0.5,
            p: 0.84
        },
        f3: {
            a: 0.035,
            b: -0.2,
            c: 0.16,
            d: 0.04,
            e: -0.09,
            f: 0.02,
            p: 0.07
        },
        f4: {
            a: -0.04,
            b: 0.2,
            c: 0.16,
            d: 0.04,
            e: 0.083,
            f: 0.12,
            p: 0.07
        }
    };

    let coefs: Coefs = $state(originalCoefs);
    let resetDrawing = false;

    const setCoefs = (value: 'original' | 'mutant') => {
        if (value === 'original') {
            coefs = originalCoefs;
        } else {
            coefs = mutantCoefs;
        }
        triggerResetDrawing();
    };

    const triggerResetDrawing = () => {
        resetDrawing = true;
        nbPoints = 0;
    };

    const updateFPS = () => {
        fps = frameInLastSecond;
        frameInLastSecond = 0;
        fpsUpdateTimeout = setTimeout(updateFPS, 1 * 1000);
    };

    const sketch: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(600, 600);
            // p5.background('white');
            p5.stroke('green');
            p5.strokeWeight(1);
            updateFPS();
        };

        let x = 0;
        let y = 0;

        p5.draw = () => {
            frameInLastSecond += 1;

            if (resetDrawing) {
                resetDrawing = false;
                nbPoints = 0;
                p5.clear();
            }

            if (nbPoints >= MAX_NB_POINTS) {
                return;
            }

            for (let i = 0; i < MAX_NB_POINTS / 10; i++) {
                let r = Math.random();
                let xn = 0;
                let yn = 0;

                let fw;
                if (r < coefs.f1.p) {
                    fw = coefs.f1;
                } else if (r < coefs.f1.p + coefs.f2.p) {
                    fw = coefs.f2;
                } else if (r < coefs.f1.p + coefs.f2.p + coefs.f3.p) {
                    fw = coefs.f3;
                } else {
                    fw = coefs.f4;
                }
                const { a, b, c, d, e, f } = fw;
                xn = a * x + b * y + e;
                yn = c * x + d * y + f;

                const xScreen = xn * 60 + 300;
                const yScreen = 600 - yn * 60;
                p5.point(xScreen, yScreen);
                nbPoints += 1;
                x = xn;
                y = yn;
            }
        };
    };

    onDestroy(() => {
        _p5?.remove();
        clearTimeout(fpsUpdateTimeout);
    });
</script>

<h1>Barnsley fern</h1>

<div>
    <p>Implementation of Barnsley fern</p>
    <p>
        See the <a href="https://en.wikipedia.org/wiki/Barnsley_fern">Wikipedia article</a> for details
        on the affine transformations used and their coefficients.
    </p>
</div>

<div>
    <P5 {sketch} />
</div>

<p>Number of points {nbPoints}</p>
<p>FPS {fps}</p>

<div>
    <span>Reset coefficients to known values:</span>
    <button onclick={() => setCoefs('original')}>Original</button>
    <button onclick={() => setCoefs('mutant')}>Mutant</button>
</div>

<div class="coefs-container">
    <div>fw</div>
    <div>a</div>
    <div>b</div>
    <div>c</div>
    <div>d</div>
    <div>e</div>
    <div>f</div>
    <div>p</div>

    {#each Object.entries(coefs) as entry}
        {@const [name, fw] = entry}
        <div>{name}</div>
        <div>
            <input onchange={triggerResetDrawing} bind:value={fw.a} type="number" step="0.01" />
        </div>
        <div>
            <input onchange={triggerResetDrawing} bind:value={fw.b} type="number" step="0.01" />
        </div>
        <div>
            <input onchange={triggerResetDrawing} bind:value={fw.c} type="number" step="0.01" />
        </div>
        <div>
            <input onchange={triggerResetDrawing} bind:value={fw.d} type="number" step="0.01" />
        </div>
        <div>
            <input onchange={triggerResetDrawing} bind:value={fw.e} type="number" step="0.01" />
        </div>
        <div>
            <input onchange={triggerResetDrawing} bind:value={fw.f} type="number" step="0.01" />
        </div>
        <div>
            <input onchange={triggerResetDrawing} bind:value={fw.p} type="number" step="0.01" />
        </div>
    {/each}
</div>

<style>
    .coefs-container {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
    }
</style>
