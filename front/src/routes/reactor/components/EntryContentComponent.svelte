<script lang="ts">
    import { toast } from '$lib/components/Toast';
    import type { ClipboardEntryEnriched } from '$lib/Clipboard/types';
    export let entry: ClipboardEntryEnriched;

    const copyContent = (entry: ClipboardEntryEnriched) => {
        navigator.clipboard.writeText(entry.content);
        toast.push('<i class="fas fa-check"></i> Copied to clipboard', {
            duration: 1000,
            theme: {
                '--toastBarHeight': 0
            }
        });
    };

    let contentUrl: URL | undefined;
    try {
        contentUrl = new URL(entry.content);
    } catch (_error) {}
</script>

{#if contentUrl}
    <div>
        <button class="copy-button" on:click={() => copyContent(entry)}>
            <i class="fas fa-copy"></i>
        </button>
        <a href={entry.content} target="_blank" rel="noopener noreferrer">{contentUrl.hostname}</a>
    </div>
{:else}
    <div class="entry-content" on:click={() => copyContent(entry)}>{entry.content}</div>
{/if}

<style>
    .copy-button {
        font-size: 0.8em;
    }
    .entry-content {
        cursor: pointer;
    }
</style>
