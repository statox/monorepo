<script lang="ts">
    import { Vector } from 'simple-vector';
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';

    let _p5: p5;

    let branchDirectionX = $state(-5);
    let branchDirectionY = $state(0);
    let upwardForceX = $state(0);
    let upwardForceY = $state(1);

    function easeInCubic(x: number): number {
        return x * x * x;
    }
    function easeInQuint(x: number): number {
        return x * x * x * x * x;
    }
    function easeInCirc(x: number): number {
        return 1 - Math.sqrt(1 - Math.pow(x, 2));
    }
    function easeOutCubic(x: number): number {
        return 1 - Math.pow(1 - x, 3);
    }
    function easeInOutCubic(x: number): number {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    const fns: {
        name: string;
        color: string;
        fn: (i: number) => number;
        enableDisplay: boolean;
    }[] = $state([
        {
            name: 'linear',
            color: 'black',
            enableDisplay: true,
            fn: (i: number) => i * 2
        },
        {
            name: 'exp',
            color: 'green',
            enableDisplay: false,
            fn: (i: number) => Math.exp(i / 2)
        },
        {
            name: 'expm1',
            color: 'red',
            enableDisplay: true,
            fn: (i: number) => Math.expm1(i / 2)
        },
        {
            name: 'easeInCubic',
            color: 'blue',
            enableDisplay: true,
            fn: (i: number) => 50 * easeInCubic(i / 10)
        },
        {
            name: 'easeOutCubic',
            color: '#a22ad6',
            enableDisplay: true,
            fn: (i: number) => 30 * easeOutCubic(i / 10)
        },
        {
            name: 'easeInOutCubic',
            color: '#925a16',
            enableDisplay: true,
            fn: (i: number) => 30 * easeInOutCubic(i / 10)
        },
        {
            name: 'easeInQuint',
            color: 'purple',
            enableDisplay: false,
            fn: (i: number) => 50 * easeInQuint(i / 10)
        },
        {
            name: 'easeInCirc',
            color: 'pink',
            enableDisplay: false,
            fn: (i: number) => 50 * easeInCirc(i / 10)
        }
    ]);

    const sketch1: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(1000, 600);
            p5.noStroke();
            p5.noFill();
        };

        p5.draw = () => {
            p5.background(240, 240, 240);

            const center = new Vector(p5.width / 2, p5.height / 3);
            let position = center.clone();
            const branchDirection = new Vector(branchDirectionX, branchDirectionY);
            const upwardForce = new Vector(upwardForceX, upwardForceY);

            p5.strokeWeight(2);

            for (const { color, fn, enableDisplay } of fns) {
                if (!enableDisplay) {
                    continue;
                }

                position = center.clone();
                p5.stroke(color);
                for (let i = 0; i < 10; i++) {
                    p5.circle(position.x, p5.height - position.y, 20);
                    const e = fn(i);
                    position
                        .add(branchDirection.clone().multiplyScalar(10))
                        .add(upwardForce.clone().multiplyScalar(e));
                }
            }
        };
    };

    onDestroy(() => {
        console.clear();
        _p5?.remove();
    });
</script>

<div class="container">
    <div class="fn-controls">
        <div>Name</div>
        <div>Activate display</div>
        <div>Function</div>
        {#each fns as fn, index}
            <div style="background-color: {fn.color}">{fn.name}</div>
            <input type="checkbox" bind:checked={fns[index].enableDisplay} />
            <div>{fn.fn}</div>
        {/each}
    </div>

    <P5 sketch={sketch1} />
</div>

<div class="controls">
    <div class="control-section">
        <div>Branch direction</div>
        <span>x <input bind:value={branchDirectionX} type="number" step="1" /></span>
        <span>y <input bind:value={branchDirectionY} type="number" step="1" /></span>
    </div>
    <div class="control-section">
        <div>Updward force</div>
        <span>x <input bind:value={upwardForceX} type="number" step="1" /></span>
        <span>y <input bind:value={upwardForceY} type="number" step="1" /></span>
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 0;
    }

    .controls {
        display: flex;
        flex-direction: column;
    }
    .control-section {
        display: flex;
    }
    .fn-controls {
        display: grid;
        grid-template-columns: 250px 100px 500px;
    }

    .fn-controls > div {
        border: solid 1px white;
        border-color: white;
        padding: 1em;
    }
</style>
