<script lang="ts">
    import { type ClipboardEntryEnriched } from '$lib/Clipboard';
    import EntryContentComponent from './EntryContentComponent.svelte';
    import EntryFileComponent from './EntryFileComponent.svelte';
    import EntryInfoComponent from './EntryInfoComponent.svelte';

    interface Props {
        clipboard: ClipboardEntryEnriched[];
        onDelete: () => void;
    }

    let { clipboard, onDelete }: Props = $props();
</script>

<div class="container">
    {#each clipboard.sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
        <EntryInfoComponent {entry} {onDelete} />
        <div><b>{entry.name}</b></div>
        <div class="entry-data-section">
            <EntryContentComponent {entry} />
            <br />
            <EntryFileComponent {entry} />
        </div>
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
        .entry-data-section {
            padding-bottom: 1em;
            margin-bottom: 1em;
            border-bottom: 5px solid var(--nc-tx-1);
        }
    }
    @media screen and (min-width: 750px) {
        .container {
            grid-template-columns: auto 25% 1fr;
        }
    }
</style>
