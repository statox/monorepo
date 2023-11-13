<script lang="ts">
    import { alphaLowerSort } from "$lib/helpers";
    import ChordLink from "./ChordLink.svelte";
    import type { Chord } from './types';
    import AlphabeticalIndexBar from "./AlphabeticalIndexBar.svelte";


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

    const tags: { letter: string, tag: string}[] = [];
    const artistsList = Object.keys(chordsByArtist)
    .sort(alphaLowerSort)
    .map((artist, index, list) => {
        if (index === 0 || artist[0].toLowerCase() != list[index-1][0].toLowerCase()) {
            const tag = 'anchor_letter_' + artist[0]
            tags.push({letter: artist[0], tag});
            return { name: artist, tag }
        }
        return {name: artist};
    });
</script>

<AlphabeticalIndexBar {tags} />
<table>
    {#each artistsList as artist}
        {@const chords = chordsByArtist[artist.name].sort((a, b) => a.title < b.title ? -1 : 1) }
        {@const artistTags = artist + ';' + chords.reduce((tags, chord) => tags + chord.title + ';' + chord.tags.join(','), '')}

        {#if searchString.length === 0 || artistTags.toLowerCase().match(searchString.toLowerCase())}
            <tr>
                <td id={artist.tag}>{artist.name}
                    <ul class="ul2col-container">
                        {#each chords as chord}
                            {@const chordTags = artist.name + ';' + chord.title + ';' + chord.tags.join(',')}
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
