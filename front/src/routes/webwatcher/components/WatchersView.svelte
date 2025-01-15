<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { WatchedContent } from '$lib/WebWatcher/types';
    import WatcherComponent from './WatcherComponent.svelte';

    interface Props {
        watchers: WatchedContent[];
    }

    let { watchers }: Props = $props();

    const dispatch = createEventDispatcher();

    const sortWatchers = (a: WatchedContent, b: WatchedContent) => {
        if (a.archivalDateUnix === null && b.archivalDateUnix !== null) {
            return -1;
        }
        if (a.archivalDateUnix !== null && b.archivalDateUnix === null) {
            return 1;
        }

        return b.id - a.id;
    };
</script>

<div class="container">
    {#each watchers.sort(sortWatchers) as entry}
        <WatcherComponent
            watcher={entry}
            on:delete={() => dispatch('delete')}
            on:update={() => dispatch('update')}
        />
    {/each}
</div>

<style>
    .container {
        display: grid;
        row-gap: 1em;
    }
</style>
