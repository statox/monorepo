<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { getRecipe } from '$lib/Cookbook';
    import RecipeDisplay from '../../components/RecipeDisplay.svelte';

    const id = $page.params.id;
</script>

<button onclick={() => goto('/cookbook')}>Back to list</button>

{#await getRecipe(Number(id))}
    <p>Loading data</p>
{:then recipe}
    <RecipeDisplay {recipe} />
{:catch error}
    <p>Something went wrong</p>
    <p>{JSON.stringify(error)}</p>
{/await}
