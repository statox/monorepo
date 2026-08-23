<script lang="ts">
    import { Markdown } from '$lib/components/Markdown';
    import { pageMetadataStore } from '$lib/components/Header';
    import type { Chord } from '$lib/Songbook';
    import { goto } from '$app/navigation';
    import { getTypeIconClass } from '../../utils';

    interface Props {
        // From +page.ts load() function
        data: { chord: Chord | undefined };
    }

    let { data }: Props = $props();
    const { chord } = $derived(data);

    // contentB64 was encoded on the backend with Buffer.from(text, 'utf8').toString('base64').
    // Plain atob() decodes to a binary string and mangles non-ASCII characters (e.g. accented
    // French lyrics), so re-interpret the decoded bytes as UTF-8 via TextDecoder.
    const decodedContent = $derived(
        chord?.contentB64
            ? new TextDecoder().decode(
                  Uint8Array.from(atob(chord.contentB64), (c) => c.charCodeAt(0))
              )
            : undefined
    );
    // Tag the fence as `text` so highlight.js doesn't auto-detect a language and
    // apply (sometimes wrong) syntax highlighting to the chords/lyrics.
    const markdownSource = $derived(
        decodedContent !== undefined ? '```text\n' + decodedContent + '\n```' : undefined
    );

    $effect(() => {
        pageMetadataStore.set({
            name: chord ? `${chord.artist} - ${chord.title}` : 'Songbook reader',
            iconPath: '/songbook.png',
            showAuthInHeader: true
        });
    });
</script>

<button onclick={() => goto('/songbook')}> Back </button>
{#if chord}
    <span class={getTypeIconClass(chord.type)}></span>
    <span>
        <a href={chord.url} target="_blank" rel="noopener noreferrer" title={chord.url}
            >{chord.url}</a
        >
    </span>
{/if}
{#if markdownSource}
    <Markdown source={markdownSource} />
{:else}
    <p>No extracted content available for this song.</p>
{/if}
