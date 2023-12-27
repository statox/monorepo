<script lang="ts">
    import { type ClipboardEntryEnriched } from '$lib/Clipboard/types';

    export let clipboard: ClipboardEntryEnriched[];
</script>

<div class="container">
    <div>Creation</div>
    <div>Name</div>
    <div>Content</div>

    {#each clipboard.sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
        <div>{entry.formatedCreationDate}</div>
        <div>{entry.name}</div>
        <div>{entry.content}</div>
    {/each}
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: repeat(3, auto);
    }
</style>
