<script lang="ts">
    import { toast } from '$lib/components/Toast';
    import { type ClipboardEntryEnriched } from '$lib/Clipboard/types';
    import ExpirationInfo from './ExpirationInfo.svelte';
    import EntryFileComponent from './EntryFileComponent.svelte';

    export let clipboard: ClipboardEntryEnriched[];

    const copyContent = (entry: ClipboardEntryEnriched) => {
        navigator.clipboard.writeText(entry.content);
        toast.push('<i class="fas fa-check"></i> Copied to clipboard', {
            duration: 1000,
            theme: {
                '--toastBarHeight': 0
            }
        });
    };
</script>

<div class="container">
    {#each clipboard.sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
        <ExpirationInfo {entry} />
        <div>{entry.name}</div>
        <div class="entry-content" on:click={() => copyContent(entry)}>{entry.content}</div>
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

    .entry-content {
        cursor: pointer;
    }
</style>
