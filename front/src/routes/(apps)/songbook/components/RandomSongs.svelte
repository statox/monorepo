<script lang="ts">
    import { onMount } from 'svelte';
    import ChordLink from './ChordLink.svelte';
    import type { Chord } from '$lib/Songbook';

    interface Props {
        chords: Chord[];
    }

    let { chords }: Props = $props();

    const nbRandomChords = 6;
    let randomChordIndexes: number[] = $state([]);
    let randomChords: Chord[] = $state([]);
    const getRandomSongs = () => {
        if (randomChordIndexes.length >= chords.length - nbRandomChords) {
            randomChordIndexes = [];
        }

        for (let i = 0; i < nbRandomChords; i++) {
            let randomIndex = -1;
            while (randomIndex === -1 || randomChordIndexes.includes(randomIndex)) {
                randomIndex = Math.floor(Math.random() * chords.length);
            }
            randomChordIndexes.push(randomIndex);
        }

        randomChords = randomChordIndexes
            .slice(randomChordIndexes.length - nbRandomChords)
            .map((i) => chords[i]);
    };

    const getPreviousRandomSongs = () => {
        if (randomChordIndexes.length <= nbRandomChords) {
            return;
        }
        randomChordIndexes.splice(randomChordIndexes.length - nbRandomChords);
        randomChords = randomChordIndexes
            .slice(randomChordIndexes.length - nbRandomChords)
            .map((i) => chords[i]);
    };

    onMount(() => {
        getRandomSongs();
    });
</script>

<div>
    <h3>
        Random song
        <span class="pull-right">
            {#if randomChordIndexes.length > nbRandomChords}
                <button onclick={getPreviousRandomSongs}>&nbsp↶&nbsp</button>
            {/if}
            <button onclick={getRandomSongs}>Get more random songs</button>
        </span>
    </h3>
    <br />

    <ul class="ul2col-container">
        {#each randomChords as chord (chord.url)}
            <li class="ul2col-item">
                <ChordLink {chord} showArtist={true} />
            </li>
        {/each}
    </ul>
</div>
