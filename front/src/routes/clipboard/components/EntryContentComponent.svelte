<script lang="ts">
    import { CopyButton, copyToClipboard } from '$lib/components/CopyButton';
    import type { ClipboardEntryEnriched } from '$lib/Clipboard/types';
    export let entry: ClipboardEntryEnriched;

    let contentUrl: URL | undefined;
    try {
        contentUrl = new URL(entry.content);
    } catch (error) {
        console.log('(Not an issue) Content of the following clipboard entry is not an URL', entry.id);
    }
</script>

{#if contentUrl}
    <div>
        <CopyButton content={entry.content} />
        <a href={entry.content} target="_blank" rel="noopener noreferrer">{contentUrl.hostname}</a>
    </div>
{:else}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="entry-content" on:click={() => copyToClipboard(entry.content)}>{entry.content}</div>
{/if}

<style>
    .entry-content {
        cursor: pointer;
    }
</style>
