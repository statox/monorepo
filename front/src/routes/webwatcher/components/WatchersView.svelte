<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { WatchedContent } from '$lib/WebWatcher/types';
    import WatcherComponent from './WatcherComponent.svelte';

    export let watchers: WatchedContent[];

    const dispatch = createEventDispatcher();
</script>

<div class="container">
    {#each watchers.sort((a, b) => b.id - a.id) as entry}
        <WatcherComponent watcher={entry} on:delete={() => dispatch('delete')} />
    {/each}
</div>

<style>
    .container {
        display: grid;
        row-gap: 1em;
    }
</style>
