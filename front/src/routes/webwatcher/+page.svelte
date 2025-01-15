<script lang="ts">
    import { modals } from 'svelte-modals';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import { getAllWatchers } from '$lib/WebWatcher/api';
    import WatcherForm from './components/WatcherForm.svelte';
    import WatchersView from './components/WatchersView.svelte';
    import { pageNameStore } from '$lib/components/Header';

    pageNameStore.set('Web Watchers');

    let watchersApi = getAllWatchers();
    const fetchWatchers = () => (watchersApi = getAllWatchers());
</script>

{#if $user}
    <h2>Create a new watcher</h2>
    <button on:click={() => modals.open(WatcherForm, { onUpload: fetchWatchers })}>
        Add an entry
    </button>

    <h2>Watchers</h2>
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
