<script lang="ts">
    import { DateTime } from 'luxon';
    import { untrack } from 'svelte';
    import type { Chord, RawChord } from '$lib/Songbook';
    import {
        updateExistingChord,
        deleteExistingChord,
        extractExistingChordData,
        getChordEntry
    } from '$lib/Songbook';
    import { showSuccessToast } from '$lib/components/FormLayout';
    import { ButtonDelete } from '$lib/components/ButtonDelete';
    import { ButtonEdit } from '$lib/components/ButtonEdit';
    import { ButtonExtractData } from '$lib/components/ButtonExtractData';
    import { ButtonSave } from '$lib/components/ButtonSave';
    import { ButtonCancel } from '$lib/components/ButtonCancel';

    import { goto } from '$app/navigation';
    import ChordLink from '../components/ChordLink.svelte';

    interface Props {
        // From +page.ts load() function
        data: { chords: Chord[] };
    }

    let { data }: Props = $props();
    // Seeded once from the load() result, then mutated locally by edit/delete
    // below — intentionally not a $derived mirror of `data`.
    let chords: Chord[] = $state(untrack(() => data.chords));

    const sortedChords = $derived(
        [...chords].sort((a, b) => b.creationDateUnix - a.creationDateUnix)
    );

    const formatDate = (dateUnix: number | null) => {
        if (dateUnix === null) {
            return '—';
        }
        return DateTime.fromSeconds(dateUnix).toFormat('dd/MM/yyyy');
    };

    let editingId: number | null = $state(null);
    let editArtist = $state('');
    let editTitle = $state('');
    let editUrl = $state('');
    let editTags = $state('');
    let saving = $state(false);

    const startEdit = (chord: RawChord) => {
        editingId = chord.id;
        editArtist = chord.artist;
        editTitle = chord.title;
        editUrl = chord.url;
        editTags = chord.tags.join(', ');
    };

    const cancelEdit = () => {
        editingId = null;
    };

    const saveEdit = async (id: number) => {
        const tags = editTags
            ? editTags
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter((tag) => tag.length > 0)
            : [];

        try {
            saving = true;
            await updateExistingChord({
                id,
                artist: editArtist,
                title: editTitle,
                url: editUrl,
                tags
            });
            chords = chords.map((chord) =>
                chord.id === id
                    ? { ...chord, artist: editArtist, title: editTitle, url: editUrl, tags }
                    : chord
            );
            showSuccessToast('Song updated successfully');
            editingId = null;
        } catch {
            // updateExistingChord already shows an error toast; stay in edit mode
        } finally {
            saving = false;
        }
    };

    let extractingIds: number[] = $state([]);

    const extractData = async (id: number) => {
        extractingIds = [...extractingIds, id];

        const result = await extractExistingChordData(id);
        if (result?.status === 'OK') {
            const updated = await getChordEntry({ id });
            chords = chords.map((chord) =>
                chord.id === id ? { ...chord, contentB64: updated.contentB64 } : chord
            );
        }

        extractingIds = extractingIds.filter((extractingId) => extractingId !== id);
    };

    const deleteRow = async (id: number) => {
        try {
            await deleteExistingChord(id);
            chords = chords.filter((chord) => chord.id !== id);
            showSuccessToast('Song deleted successfully');
        } catch {
            // deleteExistingChord already shows an error toast; leave the row in place
        }
    };
</script>

<h2>
    Edit song book

    <span class="pull-right">
        <button style:position="relative" onclick={() => goto('/songbook')}>
            Back to songbook
        </button>
    </span>
</h2>

{#if sortedChords.length}
    <table>
        <thead>
            <tr>
                <th>Artist</th>
                <th>Title</th>
                <th>URL</th>
                <th>Original URL</th>
                <th>Tags</th>
                <th>Created</th>
                <th>Visits</th>
                <th>Last access</th>
                <th>Extract data</th>
                <th>Edit</th>
                <th>Delete</th>
            </tr>
        </thead>
        <tbody>
            {#each sortedChords as chord (chord.id)}
                <tr>
                    {#if editingId === chord.id}
                        <td><input type="text" bind:value={editArtist} /></td>
                        <td><input type="text" bind:value={editTitle} /></td>
                        <td>-</td>
                        <td><input type="text" bind:value={editUrl} /></td>
                        <td><input type="text" bind:value={editTags} /></td>
                    {:else}
                        <td>{chord.artist}</td>
                        <td>{chord.title}</td>
                        <td>
                            <ChordLink {chord} />
                        </td>
                        <td>
                            <a href={chord.url}>{new URL(chord.url).hostname}</a>
                        </td>
                        <td>{chord.tags.join(', ')}</td>
                    {/if}
                    <td>{formatDate(chord.creationDateUnix)}</td>
                    <td>{chord.visitsCount}</td>
                    <td>{formatDate(chord.lastAccessDateUnix)}</td>
                    <td>
                        {#if !chord.contentB64}
                            <ButtonExtractData
                                loading={extractingIds.includes(chord.id)}
                                extractAction={() => extractData(chord.id)}
                            />
                        {/if}
                    </td>
                    <td>
                        {#if editingId === chord.id}
                            <ButtonSave disabled={saving} saveAction={() => saveEdit(chord.id)} />
                            <ButtonCancel disabled={saving} cancelAction={cancelEdit} />
                        {:else}
                            <ButtonEdit editAction={() => startEdit(chord)} />
                        {/if}
                    </td>
                    <td>
                        <ButtonDelete deleteAction={() => deleteRow(chord.id)} />
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}
