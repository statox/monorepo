<script lang="ts">
    import { onMount } from 'svelte';
    import { alphaLowerSort } from '$lib/helpers';
    import BackToTop from '$lib/components/BackToTop/Main.svelte';
    import type { Chord } from './types';
    import ChordLink from './ChordLink.svelte';
    export let chords: Chord[];

    let searchString = '';

    let nbLatestChords = 6;
    let latestChords: Chord[] = [];
    const getMoreLatestSongs = () => {
        nbLatestChords += 4;
        latestChords = chords
        .filter(c => c.creationDate)
        .sort((a, b) => {
            return b.creationDate - a.creationDate;
        })
        .slice(0, nbLatestChords);
    };

    const nbRandomChords = 4;
    let randomChordIndexes: number[] = [];
    let randomChords: Chord[] = [];
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

        randomChords = randomChordIndexes
            .slice(randomChordIndexes.length - nbRandomChords)
            .map(i => chords[i]);
    }

    const getPreviousRandomSongs = () => {
        if (randomChordIndexes.length <= nbRandomChords) {
            return;
        }
        randomChordIndexes.splice(randomChordIndexes.length - nbRandomChords);
        randomChords = randomChordIndexes
            .slice(randomChordIndexes.length - nbRandomChords)
            .map(i => chords[i]);
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

    onMount(() => {
        getRandomSongs();
        getMoreLatestSongs();
    });
</script>

<h2>
    Chords
    <a class="pull-right" href="https://github.com/statox/blog/issues/105#new_comment_field" target="_blank" rel="noopener noreferrer">
        <button>Add a song</button>
    </a>
</h2>

<BackToTop />

<p>This is a list of {chords.length} song chords I have been gathering for the past 10 years and that I like to play.</p>

<div>
    <h3>
        Latest additions
        <button class="pull-right" on:click={() => getMoreLatestSongs()}>More...</button>
    </h3>
    <ul class="ul2col-container">
        {#each latestChords as chord}
            <li class="ul2col-item">
                <ChordLink {chord} />
            </li>
        {/each}
    </ul>
</div>
<br/>

<div>
    <h3>
        Random song
        <span class='pull-right'>
            {#if randomChordIndexes.length > nbRandomChords}
                <button on:click={getPreviousRandomSongs}>&nbsp↶&nbsp</button>
            {/if}
            <button on:click={getRandomSongs}>Get more random songs</button>
        </span>
    </h3>
    <br/>

    <ul class="ul2col-container">
        {#each randomChords as chord (chord.url)}
            <li class="ul2col-item">
                <ChordLink {chord} showArtist={true} />
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
