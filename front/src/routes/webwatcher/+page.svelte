<script lang="ts">
    import { openModal } from '$lib/components/Modal';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import { getAllWatchers } from '$lib/WebWatcher/api';
    import WatcherForm from './components/WatcherForm.svelte';
    import WatchersView from './components/WatchersView.svelte';

    let watchersApi = getAllWatchers();
    const fetchWatchers = () => (watchersApi = getAllWatchers());
</script>

<h2>Web Watchers</h2>

{#if $user}
    <h3>Create a new watcher</h3>
    <button on:click={() => openModal(WatcherForm, { onUpload: fetchWatchers })}>
        Add an entry
    </button>

    <h3>Watchers</h3>
    {#await watchersApi}
        <p>Loading data</p>
    {:then watchers}
        <WatchersView {watchers} on:delete={fetchWatchers} on:update={fetchWatchers} />
    {:catch error}
        <p>Something went wrong</p>
        <p>{JSON.stringify(error)}</p>
    {/await}
{:else}
    <Notice item={{ level: 'info', header: 'Login to list the watchers' }} />
{/if}
