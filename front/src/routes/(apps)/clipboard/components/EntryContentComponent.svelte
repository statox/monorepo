<script lang="ts">
    import { ButtonCopy, copyToClipboard } from '$lib/components/ButtonCopy';
    import type { ClipboardEntryEnriched } from '$lib/Clipboard';
    interface Props {
        entry: ClipboardEntryEnriched;
    }

    let { entry }: Props = $props();

    let contentUrl: URL | undefined = $derived.by(() => {
        try {
            return new URL(entry.content);
        } catch {
            // Content couldn't be parsed as an URL, this is fine content is
            // simply not an URL
            return;
        }
    });
</script>

{#if contentUrl}
    <div>
        <ButtonCopy content={entry.content} />
        <a href={entry.content} target="_blank" rel="noopener noreferrer">{contentUrl.hostname}</a>
    </div>
{:else}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="entry-content" onclick={() => copyToClipboard(entry.content)}>{entry.content}</div>
{/if}

<style>
    .entry-content {
        cursor: pointer;
    }
</style>
