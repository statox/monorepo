<script lang="ts">
    import { type IngredientMeta, listIngedients } from '$lib/Cookbook';
    import { onMount } from 'svelte';

    interface Props {
        onAdd: (params: { name: string; quantity?: number; unit?: string }) => void;
    }
    const { onAdd }: Props = $props();

    let ingredientsMeta: IngredientMeta[] = $state([]);

    let newIngredient = $state(false);

    let name: string = $state('');
    let quantity: number | undefined = $state();
    let unit: string | undefined = $state();

    const add = () => {
        if (!name) {
            return;
        }

        onAdd({ name, quantity, unit });
    };

    const toggleIngredientMode = () => {
        name = '';
        newIngredient = !newIngredient;
    };

    onMount(async () => {
        ingredientsMeta = (await listIngedients()).ingredients;
    });
</script>

<div class="input-container">
    <button onclick={toggleIngredientMode}>
        {newIngredient ? 'New' : 'Existing'}
    </button>
    {#if newIngredient}
        <input bind:value={name} type="text" />
    {:else}
        <select bind:value={name} onchange={() => console.log('select', name)}>
            {#each ingredientsMeta as option}
                <option value={option.name}>{option.name}</option>
            {/each}
        </select>
    {/if}

    <label for="quantity">Quantity</label>
    <input bind:value={quantity} type="number" />

    <label for="quantity">Unit</label>
    <input bind:value={unit} type="text" />

    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button onclick={add}><i class="fa fa-solid fa-plus"></i></button>
</div>

<style>
    .input-container {
        display: grid;
        grid-template-columns: auto auto;
        grid-column-gap: 1em;
    }
</style>
