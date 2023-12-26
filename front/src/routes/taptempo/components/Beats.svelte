<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';

    let _p5: p5;

    export let keptDuration: number;
    export let taps: number[];
    export let pause: boolean;

    const sketch: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(600, 100);
        };
        p5.draw = () => {
            const containerElement = document.getElementById('canvas-container');
            if (containerElement) {
                const containerWidth = containerElement?.clientWidth || 600;
                if (p5.width !== containerWidth) {
                    p5.resizeCanvas(containerWidth, 100);
                }

                const containerStyle = getComputedStyle(document.body);
                const backgroundColor = containerStyle.getPropertyValue('--nc-bg-2') || 'white';
                const lineColor = containerStyle.getPropertyValue('--nc-tx-1') || 'black';
                p5.background(backgroundColor);
                p5.stroke(lineColor);
            }

            const now = Date.now();
            const maxTS = now - keptDuration;

            for (const tap of taps) {
                const x = p5.map(tap, now, maxTS, p5.width, 0);
                p5.line(x, 0, x, p5.height);
            }
        };
    };

    $: if (pause) {
        _p5?.noLoop();
    } else {
        _p5?.loop();
    }

    onDestroy(() => {
        _p5?.remove();
    });
</script>

<div id="canvas-container" class="d-flex justify-content-center">
    <P5 {sketch} />
</div>
