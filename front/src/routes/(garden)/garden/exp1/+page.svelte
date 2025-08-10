<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';
    import { Plant } from './Plant';
    import { get } from 'svelte/store';

    let _p5: p5;

    const plant = new Plant();
    const genesInput = $state([...plant.genes]);
    plant.grow();

    const updatePlante = () => {
        plant.genes = genesInput;
        plant.grow();
    };

    const sketch1: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(500, 500);
            p5.background('black');
        };

        p5.draw = () => {
            p5.background('black');
            for (const segment of plant.structure) {
                const x = segment.position.x + p5.width / 2;
                const y = p5.height - segment.position.y;
                const size = segment.size;
                p5.fill(segment.color);
                p5.circle(x, y, size);
            }

            // p5.noLoop();
        };
    };

    onDestroy(() => {
        console.clear();
        _p5?.remove();
    });
</script>

<h1>Here be flowers</h1>

<P5 sketch={sketch1} />

<div>
    <h2>Plant info</h2>
    <div>Nb segments: {plant.structure.length}</div>
</div>

<h2>Genes</h2>
<div class="genes-container">
    <div>Level</div>
    <div>length</div>
    <div>Cell size</div>
    <div>angle amplitude</div>
    {#each genesInput as gene, index}
        <div>{index}</div>
        <div>
            <input
                type="number"
                step="0.1"
                onchange={updatePlante}
                bind:value={genesInput[index].lengthGene}
            />
        </div>
        <div>
            <input
                type="number"
                step="0.1"
                onchange={updatePlante}
                bind:value={genesInput[index].cellSize}
            />
        </div>
        <div>
            <input
                type="number"
                step="0.1"
                onchange={updatePlante}
                bind:value={genesInput[index].angleAmplitudeGene}
            />
        </div>
    {/each}
</div>

<style>
    .genes-container {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
    }
</style>
