<script lang="ts">
    import { getAllWatchers } from '$lib/WebWatcher/api';
    import WatchersView from './components/WatchersView.svelte';
    import { pageMetadataStore } from '$lib/components/Header';
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { goto } from '$app/navigation';

    pageMetadataStore.set({ name: 'Web Watchers', showAuthInHeader: true });

    let watchersApi = $state(getAllWatchers());
    const fetchWatchers = () => (watchersApi = getAllWatchers());
</script>

<AuthGuard message="Login to list the watchers" requiredScope="admin">
    <h2>Create a new watcher</h2>
    <AuthGuard message="Login to add an entry" requiredScope="admin">
        <button onclick={() => goto('/webwatcher/create')}> Add an entry </button>
    </AuthGuard>

    <h2>Watchers</h2>
    {#await watchersApi}
        <p>Loading data</p>
    {:then watchers}
        <WatchersView {watchers} onDelete={fetchWatchers} onUpdate={fetchWatchers} />
    {:catch error}
        <p>Something went wrong</p>
        <p>{JSON.stringify(error)}</p>
    {/await}
</AuthGuard>
