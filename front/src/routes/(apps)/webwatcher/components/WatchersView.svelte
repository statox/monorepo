<script lang="ts">
    import type { WatchedContent } from '$lib/WebWatcher/types';
    import WatcherComponent from './WatcherComponent.svelte';

    interface Props {
        watchers: WatchedContent[];
        onDelete: () => void;
        onUpdate: () => void;
    }

    let { watchers, onDelete, onUpdate }: Props = $props();

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
        <WatcherComponent watcher={entry} {onDelete} {onUpdate} />
    {/each}
</div>

<style>
    .container {
        display: grid;
        row-gap: 1em;
    }
</style>
