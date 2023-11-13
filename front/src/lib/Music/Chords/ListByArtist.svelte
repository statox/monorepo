<script lang="ts">
    import { alphaLowerSort } from "$lib/helpers";
    import ChordLink from "./ChordLink.svelte";
    import type { Chord } from './types';


    export let searchString: string;
    export let chords: Chord[];

    type ChordsByArtist = {
        [artist: string]: Chord[];
    };

    const chordsByArtist = chords.reduce((byArtist, chord) => {
        const artist = chord.artist;
        if (!byArtist[artist]) {
            byArtist[artist] = [];
        }
        byArtist[artist].push(chord);
        return byArtist;
    }, {} as ChordsByArtist);
</script>

<table>
    {#each Object.keys(chordsByArtist).sort(alphaLowerSort) as artist}
        {@const chords = chordsByArtist[artist].sort((a, b) => a.title < b.title ? -1 : 1) }
        {@const artistTags = artist + ';' + chords.reduce((tags, chord) => tags + chord.title + ';' + chord.tags.join(','), '')}

        {#if searchString.length === 0 || artistTags.toLowerCase().match(searchString.toLowerCase())}
            <tr>
                <td>{artist}
                    <ul class="ul2col-container">
                        {#each chords as chord}
                            {@const chordTags = artist + ';' + chord.title + ';' + chord.tags.join(',')}
                            {#if searchString.length === 0 || chordTags.toLowerCase().match(searchString.toLowerCase())}
                                <li class="ul2col-item">
                                    <ChordLink {chord} />
                                </li>
                            {/if}
                        {/each}
                    </ul>
                </td>
            </tr>
        {/if}
    {/each}
</table>

<style>
@media screen and (min-width: 600px) {
    .ul2col-container {
        display: flex;
        flex-wrap: wrap;
    }

    .ul2col-item {
        flex: 1 0 50%; /* This will make the items take up 50% of the container's width, effectively creating two columns */
        list-style-type: none; /* Optional: Removes the bullet points */
    }
}

td {
    border: none;
}

tr {
    border-bottom: solid thin;
    border-bottom-color: var(--nc-bg-0);
}

</style>
