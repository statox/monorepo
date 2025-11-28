<script lang="ts">
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageMetadataStore } from '$lib/components/Header';
    import { listRecipes } from '$lib/Cookbook';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    pageMetadataStore.set({ name: 'Cookbook' });

    const getRecipes = () => {
        if ($user) {
            return listRecipes();
        }
        return { recipes: [] };
    };
    let recipesApi = $state(getRecipes());

    const fetchData = () => (recipesApi = getRecipes());
    onMount(() => {
        fetchData();
    });
</script>

<HeadIOS title="Cookbook" description="Recipes and food" />

{#if $user}
    <button onclick={() => goto('/cookbook/add')}> Add a new recipe </button>

    <div>
        {#await recipesApi}
            <p>Loading data</p>
        {:then { recipes }}
            <ul>
                {#each recipes as recipe}
                    <li><a href={'/cookbook/recipe/' + recipe.id}>{recipe.name}</a></li>
                {/each}
            </ul>
        {:catch error}
            <p>Something went wrong</p>
            <p>{JSON.stringify(error)}</p>
        {/await}
    </div>
{:else}
    <Notice item={{ level: 'info', header: 'Login to access the recipes' }} />
{/if}
