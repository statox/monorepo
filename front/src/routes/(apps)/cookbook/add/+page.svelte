<script lang="ts">
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import RecipeForm from '../components/RecipeForm.svelte';
    import { pageMetadataStore } from '$lib/components/Header';

    pageMetadataStore.set({ name: 'Cookbook' });

    const onUpload = () => {
        console.log('New recipe created');
    };
</script>

{#if $user}
    <RecipeForm {onUpload} />
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry' }} />
{/if}
