<script lang="ts">
    import type { WatchedContent } from '$lib/WebWatcher/types';

    export let watchers: WatchedContent[];
</script>

<div class="container">
    {#each watchers.sort((a, b) => b.id - a.id) as entry}
        <p>{JSON.stringify(entry)}</p>
        <br />
    {/each}
</div>

<style>
    .container {
        display: grid;
        row-gap: 1em;
    }
</style>
