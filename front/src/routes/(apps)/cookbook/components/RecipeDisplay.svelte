<script lang="ts">
    import { Markdown } from '$lib/components/Markdown';
    import type { RecipeFull } from '$lib/Cookbook';
    import IngredientsList from './IngredientsList.svelte';

    interface Props {
        recipe: RecipeFull;
    }

    const { recipe }: Props = $props();
</script>

<h2>{recipe.name}</h2>

<h3>Ingredients</h3>
{#if recipe.ingredients.length}
    <IngredientsList ingredients={recipe.ingredients} />
{:else}
    <p>No ingredients specified in this recipe</p>
{/if}

<h3>Instructions</h3>
<div class="instructions-container">
    <Markdown source={recipe.content} />
</div>

<style>
    .instructions-container {
        border: var(--nc-info) solid 1px;
        padding: 0.3em;
    }
</style>
