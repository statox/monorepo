<script lang="ts">
    import type p5 from 'p5';
    import P5, { type Sketch } from 'p5-svelte';
    import { onDestroy } from 'svelte';
    import { Plant } from './Plant';

    let _p5: p5;

    const plant = new Plant();
    const genesInput = $state([...plant.genes]);
    plant.grow();
    let nbCellsInPlant = $state(plant.structure.length);
    let genesViewHorizontal = $state(true);

    const updatePlante = () => {
        plant.genes = genesInput;
        plant.grow();
        nbCellsInPlant = plant.structure.length;
    };

    const sketch1: Sketch = (p5) => {
        p5.setup = () => {
            _p5 = p5;
            p5.createCanvas(1000, 1000);
            p5.background('black');
        };

        p5.draw = () => {
            p5.background('black');
            for (const cell of plant.structure) {
                const x = cell.position.x + p5.width / 2;
                const y = p5.height - cell.position.y;
                const size = cell.size;
                p5.fill(cell.color);
                p5.circle(x, y, size);
            }
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
    <div>Nb segments: {nbCellsInPlant}</div>
</div>

<span
    ><h2>Genes</h2>
    <button onclick={() => (genesViewHorizontal = !genesViewHorizontal)}>Change view</button></span
>
{#if genesViewHorizontal}
    <div class="genes-container">
        <div>Level</div>
        <div>cellSizeVariationInSegment</div>
        <div>nbCellsInSegment</div>
        <div>cellSpacingVariationInSegment</div>
        <div>nextSegmentBaseCellSize</div>
        <div>branchesMaxAngle</div>
        <div>nbBranches</div>
        {#each genesInput as gene, index}
            <div style="color: {gene.color}">{index}</div>
            <div>
                <input
                    type="number"
                    step="0.1"
                    onchange={updatePlante}
                    bind:value={gene.cellSizeVariationInSegment}
                />
            </div>
            <div>
                <input
                    type="number"
                    step="1"
                    onchange={updatePlante}
                    bind:value={gene.nbCellsInSegment}
                />
            </div>
            <div>
                <input
                    type="number"
                    step="0.1"
                    onchange={updatePlante}
                    bind:value={gene.cellSpacingVariationInSegment}
                />
            </div>
            <div>
                <input
                    type="number"
                    step="0.1"
                    onchange={updatePlante}
                    bind:value={gene.nextSegmentBaseCellSize}
                />
            </div>
            <div>
                <input
                    type="number"
                    step="1"
                    onchange={updatePlante}
                    bind:value={gene.branchesMaxAngle}
                />
            </div>
            <div>
                <input
                    type="number"
                    step="1"
                    onchange={updatePlante}
                    bind:value={gene.nbBranches}
                />
            </div>
        {/each}
    </div>
{:else}
    <div class="genes-container-2">
        <div>Level</div>
        {#each genesInput as gene, index}
            <div style="color: {gene.color}">{index}</div>
        {/each}

        <div>cellSizeVariationInSegment</div>
        {#each genesInput as gene}
            <div>
                <input
                    type="number"
                    step="0.1"
                    onchange={updatePlante}
                    bind:value={gene.cellSizeVariationInSegment}
                />
            </div>
        {/each}

        <div>nbCellsInSegment</div>
        {#each genesInput as gene}
            <div>
                <input
                    type="number"
                    step="1"
                    onchange={updatePlante}
                    bind:value={gene.nbCellsInSegment}
                />
            </div>
        {/each}

        <div>cellSpacingVariationInSegment</div>
        {#each genesInput as gene}
            <div>
                <input
                    type="number"
                    step="0.1"
                    onchange={updatePlante}
                    bind:value={gene.cellSpacingVariationInSegment}
                />
            </div>
        {/each}

        <div>nextSegmentBaseCellSize</div>
        {#each genesInput as gene}
            <div>
                <input
                    type="number"
                    step="0.1"
                    onchange={updatePlante}
                    bind:value={gene.nextSegmentBaseCellSize}
                />
            </div>
        {/each}

        <div>branchesMaxAngle</div>
        {#each genesInput as gene}
            <div>
                <input
                    type="number"
                    step="1"
                    onchange={updatePlante}
                    bind:value={gene.branchesMaxAngle}
                />
            </div>
        {/each}

        <div>nbBranches</div>
        {#each genesInput as gene}
            <div>
                <input
                    type="number"
                    step="1"
                    onchange={updatePlante}
                    bind:value={gene.nbBranches}
                />
            </div>
        {/each}
    </div>
{/if}

<style>
    .genes-container {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
    }
    .genes-container-2 {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
    }
</style>
