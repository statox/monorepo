<script lang="ts">
    import type { WatchedContent } from '$lib/WebWatcher/types';
    import WatcherComponent from './WatcherComponent.svelte';

    export let watchers: WatchedContent[];
</script>

<div class="container">
    {#each watchers.sort((a, b) => b.id - a.id) as entry}
        <WatcherComponent watcher={entry} />
    {/each}
</div>

<style>
    .container {
        display: grid;
        row-gap: 1em;
    }
</style>
