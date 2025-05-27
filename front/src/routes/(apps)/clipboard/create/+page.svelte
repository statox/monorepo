<script lang="ts">
    import { pageNameStore } from '$lib/components/Header';
    import ClipboardForm from '../components/ClipboardForm.svelte';

    pageNameStore.set('Clipboard');
</script>

<ClipboardForm onUpload={() => console.log('new entry created')} />
