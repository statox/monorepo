<script lang="ts">
    import { goto } from '$app/navigation';
    import { pageMetadataStore } from '$lib/components/Header';
    import ReactorForm from '../components/ReactorForm.svelte';

    const pageMetadata = {
        name: 'Reactor',
        description: 'My collection of memes',
        showAuthInHeader: true
    } as const;
    pageMetadataStore.set(pageMetadata);
</script>

<ReactorForm onUpload={() => goto('/reactor')} />
