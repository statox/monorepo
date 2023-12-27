<script lang="ts">
    import { type ClipboardEntryEnriched } from '$lib/Clipboard/types';
    import { deleteClipboardEntry } from '$lib/Clipboard/api';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    export let clipboard: ClipboardEntryEnriched[];

    const deleteEntry = (name: string) => {
        deleteClipboardEntry(name).then((_response) => dispatch('delete'));
    };
</script>

<div class="container">
    <div>Name</div>
    <div>Content</div>
    <div>Creation</div>
    <div>Expiration</div>
    <div>Expiration Status</div>
    <div>Public</div>
    <div>Action</div>

    {#each clipboard.sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
        <div>{entry.name}</div>
        <div>{entry.content}</div>
        <div>{entry.formatedCreationDate}</div>
        <div>{entry.formatedExpirationDate}</div>
        <div>{entry.expirationStatus}</div>
        <input type="checkbox" bind:checked={entry.isPublic} disabled />
        <button class="delete-button" on:click={() => deleteEntry(entry.name)}>
            <i class="fas fa-trash-alt"></i>
        </button>
    {/each}
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: repeat(7, auto);
    }
    .delete-button {
        background: red;
        color: white;
        padding: 0;
        width: 2em;
    }
</style>
