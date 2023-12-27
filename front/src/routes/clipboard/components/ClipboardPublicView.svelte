<script lang="ts">
    import { type ClipboardEntry } from '$lib/Clipboard/types';

    export let clipboard: ClipboardEntry[];
</script>

<div class="container">
    <div>Name</div>
    <div>Content</div>
    <div>Creation date</div>

    {#each clipboard.sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
        <div>{entry.name}</div>
        <div>{entry.content}</div>
        <div>{entry.creationDateUnix}</div>
    {/each}
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: repeat(3, auto);
    }
</style>
