<script lang="ts">
    import { FilteredSelect } from '$lib/components/FilteredSelect';
    import { listIngedients } from '$lib/Cookbook';
    import { onMount } from 'svelte';

    interface Props {
        onAdd: (params: { name: string; quantity?: number; unit?: string }) => void;
    }
    const { onAdd }: Props = $props();

    let ingredientsNames: string[] = $state([]);

    let name: string = $state('');
    let quantity: number | undefined = $state();
    let unit: string | undefined = $state();

    const add = () => {
        if (!name) {
            return;
        }

        onAdd({ name, quantity, unit });
    };

    onMount(async () => {
        ingredientsNames = (await listIngedients()).ingredients
            .sort((a, b) => (a < b ? 1 : 0))
            .map((i) => i.name);
    });
</script>

<div class="input-container">
    <label for="name">Ingredient</label>
    <FilteredSelect bind:value={name} options={ingredientsNames} />

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

    @media screen and (max-width: 600px) {
        .input-container {
            grid-template-columns: 100%;
        }
    }
</style>
