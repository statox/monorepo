<script lang="ts">
    import { ButtonDelete } from '$lib/components/ButtonDelete';

    interface Ingredient {
        name: string;
        quantity?: number;
        unit?: string;
    }

    interface Props {
        ingredients: Ingredient[];
        editable?: true;
    }

    let { ingredients = $bindable(), editable }: Props = $props();
    const deleteIngredientByName = (name: string) => {
        ingredients = ingredients.filter((i) => i.name !== name);
    };
</script>

<div class="list-container">
    {#each ingredients.toSorted((a, b) => (a.name < b.name ? -1 : 1)) as ingredient}
        <div class="ingredient-container">
            {#if editable}
                <span class="delete-button">
                    <ButtonDelete deleteAction={() => deleteIngredientByName(ingredient.name)} />
                </span>
            {/if}

            <div>{ingredient.name}</div>
            {#if ingredient.quantity || ingredient.unit}
                <div class="unit">({ingredient.quantity}{ingredient.unit})</div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .list-container {
        display: grid;
        flex-direction: column;
        gap: 0.2em;
    }

    .ingredient-container {
        display: flex;
        flex-direction: row;
    }

    .delete-button {
        margin-right: 1em;
    }
</style>
