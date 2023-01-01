<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';

    let _p5: p5;

    const sketch: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(p5.windowWidth * 0.5, (7 / 16) * p5.windowWidth * 0.5);
        };
        p5.draw = () => {
            p5.background([8, 84, 19]);
        };
    };

    onDestroy(() => {
        _p5?.remove();
    });
</script>

<span>Hello Game</span>

<div class="d-flex justify-content-center">
    <P5 {sketch} />
</div>
