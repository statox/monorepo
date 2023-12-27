<script lang="ts">
    import { type ClipboardEntry } from '$lib/Clipboard/types';

    export let clipboard: ClipboardEntry[];
</script>

<div class="container">
    <div>Name</div>
    <div>Content</div>
    <div>Creation date</div>
    <div>Public</div>

    {#each clipboard.sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
        <div>{entry.name}</div>
        <div>{entry.content}</div>
        <div>{entry.creationDateUnix}</div>
        <input type="checkbox" bind:checked={entry.isPublic} />
    {/each}
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: repeat(4, auto);
    }
</style>
