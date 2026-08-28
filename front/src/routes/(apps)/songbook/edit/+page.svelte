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
    import { base } from '$app/paths';
    import ChordLink from '../components/ChordLink.svelte';

    interface Props {
        // From +page.ts load() function
        data: { chords: Chord[] };
    }

    let { data }: Props = $props();
    // Seeded once from the load() result, then mutated locally by edit/delete
    // below — intentionally not a $derived mirror of `data`.
    let chords: Chord[] = $state(untrack(() => data.chords));

    type SortColumn = 'CreationDateUnix' | 'Artist' | 'ExtractedData';
    let sortColumn: SortColumn = $state('CreationDateUnix');
    type SortOrder = 'asc' | 'desc';
    let sortOrder: SortOrder = $state('desc');

    const updateSort = (newValue: SortColumn) => {
        if (sortColumn === newValue) {
            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            return;
        }
        sortColumn = newValue;
    };

    const sortedChords = $derived.by(() => {
        const order = sortOrder === 'asc' ? 1 : -1;
        return [...chords].sort((a, b) => {
            if (sortColumn === 'CreationDateUnix') {
                return (a.creationDateUnix - b.creationDateUnix) * order;
            }
            if (sortColumn === 'Artist') {
                if (b.artist === a.artist) {
                    return b.title < a.title ? -order : order;
                }
                return b.artist < a.artist ? -order : order;
            }
            if (sortColumn === 'ExtractedData') {
                if (b.contentB64 && a.contentB64) {
                    return b.artist < a.artist ? -order : order;
                }
                if (b.contentB64 && !a.contentB64) {
                    return order;
                }
                if (a.contentB64 && !b.contentB64) {
                    return -order;
                }
                return b.artist < a.artist ? -order : order;
            }

            return (b.creationDateUnix - a.creationDateUnix) * order;
        });
    });

    const formatDate = (dateUnix: number | null) => {
        if (dateUnix === null) {
            return '—';
        }
        return DateTime.fromSeconds(dateUnix).toFormat('dd/MM/yy');
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
                <th>id></th>
                <th onclick={() => updateSort('Artist')}>Artist</th>
                <th>Title</th>
                <th>URL</th>
                <th>Original URL</th>
                <th>Tags</th>
                <th onclick={() => updateSort('CreationDateUnix')}>Created</th>
                <th>Visits</th>
                <th>Last access</th>
                <th onclick={() => updateSort('ExtractedData')}>Extract data</th>
                <th>Edit</th>
                <th>Reader</th>
                <th>Delete</th>
            </tr>
        </thead>
        <tbody>
            {#each sortedChords as chord (chord.id)}
                <tr class:editing={editingId === chord.id}>
                    <td>{chord.id}</td>
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
                        <a href={`${base}/songbook/reader/${chord.id}`} title="Open in reader">
                            <button aria-label="Open in reader">
                                <span class="fas fa-book-open"></span>
                            </button>
                        </a>
                    </td>
                    <td>
                        <ButtonDelete deleteAction={() => deleteRow(chord.id)} />
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<style>
    tr:hover {
        background-color: var(--nc-bg-3);
    }

    tr.editing {
        background-color: var(--nc-bg-3);
    }
    .fa-book-open {
        color: #2e7d32;
    }
</style>
