<script lang="ts">
    import { untrack } from 'svelte';
    import { MonospaceColumns } from '$lib/components/MonospaceColumns';
    import { pageMetadataStore } from '$lib/components/Header';
    import type { Chord } from '$lib/Songbook';
    import { updateExistingChord } from '$lib/Songbook';
    import { goto } from '$app/navigation';
    import { getTypeIconClass } from '../../utils';

    interface Props {
        // From +page.ts load() function
        data: { chord: Chord | undefined };
    }

    let { data }: Props = $props();
    // Seeded once from the load() result, then mutated locally after a successful
    // save — intentionally not a $derived mirror of `data`.
    let chord: Chord | undefined = $state(untrack(() => data.chord));

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

    let editMode = $state(false);
    let editedContent = $state('');
    let saving = $state(false);

    const toggleEdit = () => {
        if (editMode) {
            editMode = false;
        } else {
            editedContent = decodedContent ?? '';
            editMode = true;
        }
    };

    const saveContent = async () => {
        if (!chord) {
            return;
        }

        // contentB64 must be re-encoded the same way the backend decodes it: UTF-8 bytes,
        // base64-encoded, so accented characters survive the round-trip.
        const contentB64 = btoa(String.fromCharCode(...new TextEncoder().encode(editedContent)));

        try {
            saving = true;
            await updateExistingChord({
                id: chord.id,
                artist: chord.artist,
                title: chord.title,
                url: chord.url,
                tags: chord.tags,
                contentB64
            });
            chord = { ...chord, contentB64 };
            editMode = false;
        } catch {
            // updateExistingChord already shows an error toast; stay in edit mode
        } finally {
            saving = false;
        }
    };

    $effect(() => {
        pageMetadataStore.set({
            name: chord ? `${chord.artist} - ${chord.title}` : 'Songbook reader',
            iconPath: '/songbook.png',
            showAuthInHeader: true
        });
    });
</script>

<button onclick={() => goto('/songbook')}> Back </button>
<button onclick={toggleEdit}> {editMode ? 'Cancel' : 'Edit'} </button>
{#if editMode}
    <button disabled={saving} onclick={saveContent}> Save </button>
{/if}
{#if chord}
    <span class={getTypeIconClass(chord.type)}></span>
    <span>
        <a href={chord.url} target="_blank" rel="noopener noreferrer" title={chord.url}
            >{new URL(chord.url).hostname}</a
        >
    </span>
{/if}
{#if editMode}
    <textarea bind:value={editedContent}></textarea>
{:else if decodedContent}
    <MonospaceColumns content={decodedContent} />
{:else}
    <p>No extracted content available for this song.</p>
{/if}

<style>
    textarea {
        width: 100%;
        height: 100vh;
    }
</style>
