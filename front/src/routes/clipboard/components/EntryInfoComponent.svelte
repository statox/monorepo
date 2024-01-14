<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/auth/service';
    import { deleteClipboardEntry } from '$lib/Clipboard/api';
    import type { ClipboardEntryEnriched } from '$lib/Clipboard/types';
    import ExpirationInfo from './ExpirationInfo.svelte';

    export let entry: ClipboardEntryEnriched;
    const dispatch = createEventDispatcher();

    const deleteEntry = (name: string) => {
        deleteClipboardEntry(name).then((_response) => dispatch('delete'));
    };
</script>

<div class="info-container">
    <ExpirationInfo {entry} />

    {#if $user}
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
    {/if}
</div>

<style>
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
