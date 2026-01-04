<script lang="ts">
    import { goto } from '$app/navigation';
    import { pageMetadataStore } from '$lib/components/Header';
    import ClipboardForm from '../components/ClipboardForm.svelte';

    const pageMetadata = {
        name: 'Clipboard',
        description: 'My universal clipboard app',
        iconPath: '/clipboard.png',
        showAuthInHeader: true
    } as const;
    pageMetadataStore.set(pageMetadata);
</script>

<ClipboardForm onUpload={() => goto('/clipboard')} />
