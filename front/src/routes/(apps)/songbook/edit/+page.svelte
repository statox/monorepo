<script lang="ts">
    import { DateTime } from 'luxon';
    import type { RawChord } from '$lib/Songbook';

    import { goto } from '$app/navigation';
    import { AuthGuard } from '$lib/components/AuthGuard';

    interface Props {
        // From +page.ts load() function
        data: { chords: RawChord[] };
    }

    let { data }: Props = $props();
    let { chords } = $derived(data);

    const sortedChords = $derived(
        [...chords].sort((a, b) => b.creationDateUnix - a.creationDateUnix)
    );

    const formatDate = (dateUnix: number | null) => {
        if (dateUnix === null) {
            return '—';
        }
        return DateTime.fromSeconds(dateUnix).toLocaleString(DateTime.DATETIME_MED);
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

<AuthGuard message="Login to add a new song" requiredScope="admin">
    <button style:position="relative" onclick={() => goto('/songbook/edit/create')}>
        Add a song
    </button>
</AuthGuard>

{#if sortedChords.length}
    <table>
        <thead>
            <tr>
                <th>Artist</th>
                <th>Title</th>
                <th>URL</th>
                <th>Tags</th>
                <th>Created</th>
                <th>Visits</th>
                <th>Last access</th>
            </tr>
        </thead>
        <tbody>
            {#each sortedChords as chord (chord.id)}
                <tr>
                    <td>{chord.artist}</td>
                    <td>{chord.title}</td>
                    <td>
                        <a href={chord.url} target="_blank" rel="noopener noreferrer">{chord.url}</a
                        >
                    </td>
                    <td>{chord.tags.join(', ')}</td>
                    <td>{formatDate(chord.creationDateUnix)}</td>
                    <td>{chord.visitsCount}</td>
                    <td>{formatDate(chord.lastAccessDateUnix)}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}
