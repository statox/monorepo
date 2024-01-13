<script lang="ts">
    import { type ClipboardEntryEnriched } from '$lib/Clipboard/types';
    import { deleteClipboardEntry } from '$lib/Clipboard/api';
    import { createEventDispatcher } from 'svelte';
    import ExpirationInfo from './ExpirationInfo.svelte';
    import EntryContentComponent from './EntryContentComponent.svelte';
    import EntryFileComponent from './EntryFileComponent.svelte';

    const dispatch = createEventDispatcher();
    export let clipboard: ClipboardEntryEnriched[];

    const deleteEntry = (name: string) => {
        deleteClipboardEntry(name).then((_response) => dispatch('delete'));
    };
</script>

<div class="container">
    {#each clipboard.sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
        <div class="info-container">
            <ExpirationInfo {entry} />
            <input
                class="is-public-checkbox"
                type="checkbox"
                bind:checked={entry.isPublic}
                disabled
            />
            <button class="delete-button" on:click={() => deleteEntry(entry.name)}>
                <i class="fas fa-trash-alt"></i>
            </button>
            <div>{entry.formatedCreationDate}</div>
        </div>
        <div>{entry.name}</div>
        <EntryContentComponent {entry} />
        <EntryFileComponent {entry} />
    {/each}
</div>

<style>
    .container {
        display: grid;
        row-gap: 1em;
    }

    @media screen and (max-width: 750px) {
        .container {
            grid-template-columns: 100%;
        }
    }
    @media screen and (min-width: 750px) {
        .container {
            grid-template-columns: 25% 25% 35% 35%;
        }
    }

    .info-container {
        display: flex;
        flex-direction: row;
        gap: 10px 10px;
        justify-content: flex-start;
    }
    .delete-button {
        background: red;
        color: white;
        padding: 0;
        width: 2em;
        height: 2em;
    }
    .is-public-checkbox {
        height: 2em;
    }
</style>
