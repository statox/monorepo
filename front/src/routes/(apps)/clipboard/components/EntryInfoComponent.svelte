<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { user } from '$lib/auth2';
    import { deleteClipboardEntry } from '$lib/Clipboard/api';
    import type { ClipboardEntryEnriched } from '$lib/Clipboard/types';
    import { ButtonDelete } from '$lib/components/ButtonDelete';
    import ExpirationInfo from './ExpirationInfo.svelte';

    interface Props {
        entry: ClipboardEntryEnriched;
    }

    let { entry }: Props = $props();
    const dispatch = createEventDispatcher();

    const deleteEntry = (name: string) => {
        deleteClipboardEntry({ name }).then(() => dispatch('delete'));
    };
</script>

<div class="info-container">
    {#if $user}
        <button class="visibility-status" class:visibility-public={entry.isPublic} disabled>
            {#if entry.isPublic}
                <i class="fas fa-lock-open"></i>
            {:else}
                <i>&nbsp</i>
            {/if}
        </button>

        <ExpirationInfo {entry} />
        <ButtonDelete deleteAction={() => deleteEntry(entry.name)} />
        <div class="creation-date">{entry.formatedCreationDate}</div>
    {:else}
        <ExpirationInfo {entry} />
    {/if}
</div>

<style>
    .info-container {
        display: flex;
        flex-direction: row;
        gap: 10px 10px;
        justify-content: flex-start;
        align-items: baseline;
        margin-right: 10px;
    }
    .visibility-status {
        height: 33px;
        width: 40px;
        background-color: rgba(0, 0, 0, 0);
    }
    .visibility-public {
        background-color: var(--nc-error);
    }
    .creation-date {
        width: max-content;
    }
</style>
