<script lang="ts">
    import { goto } from '$app/navigation';
    import { pageMetadataStore } from '$lib/components/Header';
    import ChordForm from '../components/ChordForm.svelte';

    const pageMetadata = {
        name: 'Songbook',
        description: 'My collection of chords',
        showAuthInHeader: true
    } as const;
    pageMetadataStore.set(pageMetadata);
</script>

<ChordForm onUpload={() => goto('/songbook/edit')} />
