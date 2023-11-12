<script lang="ts">
    import { onMount } from 'svelte';
    import type { Chord } from './types';
    export let chords: Chord[];

    const nbLatestChords = 10;
    const latestChords = chords
        .filter(c => c.creationDate)
        .sort((a, b) => {
            return b.creationDate - a.creationDate;
        })
        .slice(0, nbLatestChords);

    const noop = () => {};


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

<style>
@media screen and (min-width: 600px) {
    .ul2col {
        columns: 2;
        -webkit-columns: 2;
        -moz-columns: 2;
    }
}
</style>
