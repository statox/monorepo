<script lang="ts">
    import RecipeForm from '../components/RecipeForm.svelte';
    import { pageMetadataStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';

    pageMetadataStore.set({ name: 'Cookbook', showAuthInHeader: true });

    const onUpload = () => {
        goto('/cookbook');
    };
</script>

<RecipeForm {onUpload} />
