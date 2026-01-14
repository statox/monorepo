<script lang="ts">
    import { goto } from '$app/navigation';
    import { pageMetadataStore } from '$lib/components/Header';
    import WatcherForm from '../components/WatcherForm.svelte';

    pageMetadataStore.set({ name: 'Web Watchers', showAuthInHeader: true });
</script>

<WatcherForm onUpload={() => goto('/webwatcher')} />
