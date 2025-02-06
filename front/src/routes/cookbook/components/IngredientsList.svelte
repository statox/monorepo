<script lang="ts">
    interface Ingredient {
        name: string;
        quantity?: number;
        unit?: string;
    }

    interface Props {
        ingredients: Ingredient[];
        editable?: true;
    }

    const { ingredients = $bindable(), editable }: Props = $props();
</script>

{#each ingredients as ingredient, index}
    <div class="ingredient-container">
        <div>{ingredient.name}</div>
        <div>{ingredient.quantity}</div>
        <div>{ingredient.unit}</div>

        {#if editable}
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button onclick={() => ingredients.splice(index, 1)}>
                <i class="fa fa-solid fa-minus"></i>
            </button>
        {/if}
    </div>
{/each}

<style>
    .ingredient-container {
        display: flex;
    }
</style>
