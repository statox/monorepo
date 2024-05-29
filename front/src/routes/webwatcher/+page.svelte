<script lang="ts">
    import { user } from '$lib/auth/service';
    import { getAllWatchers } from '$lib/WebWatcher/api';
    import WatcherForm from './components/WatcherForm.svelte';
    import WatchersView from './components/WatchersView.svelte';

    const getWatchers = () => {
        if ($user) {
            return getAllWatchers();
        }
        return [];
    };
    let watchersApi = getWatchers();
</script>

<h2>Web Watchers</h2>

{#if $user}
    <details>
        <summary>Create a new watcher</summary>
        <WatcherForm on:upload={() => (watchersApi = getWatchers())} />
    </details>

    <h3>Watchers</h3>
    {#await watchersApi}
        <p>Loading data</p>
    {:then watchers}
        <WatchersView {watchers} />
    {:catch error}
        <p>Something went wrong</p>
        <p>{JSON.stringify(error)}</p>
    {/await}
{:else}
    <p>Login to list the watchers</p>
{/if}
