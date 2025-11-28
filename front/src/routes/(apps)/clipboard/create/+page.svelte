<script lang="ts">
    import { pageMetadataStore } from '$lib/components/Header';
    import ClipboardForm from '../components/ClipboardForm.svelte';

    const pageMetadata = {
        name: 'Clipboard',
        description: 'My universal clipboard app',
        iconPath: '/clipboard.png'
    };
    pageMetadataStore.set(pageMetadata);
</script>

<ClipboardForm onUpload={() => console.log('new entry created')} />
