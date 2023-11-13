<script lang="ts">
    import { onMount } from 'svelte';
    import { alphaSort } from '$lib/helpers';
    import type { Chord } from './types';
    export let chords: Chord[];

    let searchString = '';

    const nbLatestChords = 10;
    const latestChords = chords
    .filter(c => c.creationDate)
    .sort((a, b) => {
        return b.creationDate - a.creationDate;
    })
    .slice(0, nbLatestChords);

    const nbRandomChords = 4;
    let randomChordIndexes: number[] = [];
    const getRandomSongs = () => {
        if (randomChordIndexes.length >= chords.length - nbRandomChords) {
            randomChordIndexes = [];
        }

        for (let i=0; i<nbRandomChords; i++) {
            let randomIndex = -1;
            while (randomIndex === -1 || randomChordIndexes.includes(randomIndex)) {
                randomIndex = Math.floor(Math.random() * chords.length);
            }
            randomChordIndexes.push(randomIndex);
        }

        randomChordIndexes = randomChordIndexes;
    }

    const getPreviousRandomSongs = () => {
        if (randomChordIndexes.length <= nbRandomChords) {
            return;
        }
        randomChordIndexes.splice(randomChordIndexes.length - nbRandomChords);
        randomChordIndexes = randomChordIndexes;
    };

    type chordsByArtist = {
        [artist: string]: Chord[];
    };
    const chordsByArtist = chords.reduce((byArtist, chord) => {
        const artist = chord.artist;
        if (!byArtist[artist]) {
            byArtist[artist] = [];
        }
        byArtist[artist].push(chord);
        return byArtist;
    }, {} as chordsByArtist);

    onMount(() => {getRandomSongs()});
</script>

<h2>Chords</h2>

<p>This is a list of {chords.length} song chords I have been gathering for the past 10 years and that I like to play.</p>

<div>
    <h3>Latest additions</h3>
    <ul class="ul2col">
        {#each latestChords as chord}
            <li>
                <span>
                    <a href={chord.url} target="_blank" rel="noopener noreferrer">{chord.title}</a>
                </span>
            </li>
        {/each}
    </ul>
</div>
<br/>

<div>
    <h3>Random song</h3>
    <button on:click={getRandomSongs}>Get a random song</button>
    {#if randomChordIndexes.length > nbRandomChords}
        <button on:click={getPreviousRandomSongs}>&nbsp↶&nbsp</button>
    {/if}
    <br/>

    <ul>
        {#each randomChordIndexes.slice(randomChordIndexes.length - nbRandomChords) as chordIndex}
            {@const chord = chords[chordIndex]}
            <li>
                <span>
                    <a href={chord.url} target="_blank" rel="noopener noreferrer">{chord.artist} - {chord.title}</a>
                </span>
            </li>
        {/each}
    </ul>
</div>
<br/>


<div>
    <h3>All chords</h3>
    Search an artist or a title: <input type="text" bind:value={searchString} >
    <button on:click={() => searchString = ''}>&nbsp✖&nbsp</button>
</div>
<br/>

<table>
    {#each Object.keys(chordsByArtist).sort(alphaSort) as artist}
        {@const chords = chordsByArtist[artist].sort((a, b) => a.title < b.title ? -1 : 1) }
        {@const artistTags = artist + ';' + chords.reduce((tags, chord) => tags + chord.title + ';' + chord.tags.join(','), '')}

        {#if searchString.length === 0 || artistTags.toLowerCase().match(searchString.toLowerCase())}
            <tr>
                <td>{artist}
                    <ul class="ul2col">
                        {#each chords as chord}
                            {@const chordTags = artist + ';' + chord.title + ';' + chord.tags.join(',')}
                            {#if searchString.length === 0 || chordTags.toLowerCase().match(searchString.toLowerCase())}
                                <li>
                                    <span>
                                        <a href={chord.url} target="_blank" rel="noopener noreferrer">{chord.title}</a>
                                    </span>
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
    .ul2col {
        columns: 2;
        -webkit-columns: 2;
        -moz-columns: 2;
    }
}
</style>
