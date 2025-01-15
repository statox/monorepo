<script lang="ts">
    import { ButtonCopy, copyToClipboard } from '$lib/components/ButtonCopy';
    import type { ClipboardEntryEnriched } from '$lib/Clipboard/types';
    interface Props {
        entry: ClipboardEntryEnriched;
    }

    let { entry }: Props = $props();

    let contentUrl: URL | undefined = $state();
    try {
        contentUrl = new URL(entry.content);
    } catch (error) {
        console.log(
            '(Not an issue) Content of the following clipboard entry is not an URL',
            entry.id
        );
    }
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
