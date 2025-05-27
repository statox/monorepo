<script lang="ts">
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import RecipeForm from '../components/RecipeForm.svelte';
    import { pageNameStore } from '$lib/components/Header';

    pageNameStore.set('Cookbook');

    const onUpload = () => {
        console.log('New recipe created');
    };
</script>

{#if $user}
    <RecipeForm {onUpload} />
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry' }} />
{/if}
