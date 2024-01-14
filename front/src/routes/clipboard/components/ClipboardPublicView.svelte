<script lang="ts">
    import { type ClipboardEntryEnriched } from '$lib/Clipboard/types';
    import EntryInfoComponent from './EntryInfoComponent.svelte';
    import EntryContentComponent from './EntryContentComponent.svelte';
    import EntryFileComponent from './EntryFileComponent.svelte';

    export let clipboard: ClipboardEntryEnriched[];
</script>

<div class="container">
    {#each clipboard.sort((a, b) => b.creationDateUnix - a.creationDateUnix) as entry}
        <EntryInfoComponent {entry} />
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
</style>
