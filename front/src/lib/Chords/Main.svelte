<script lang="ts">
    import BackToTop from '$lib/components/BackToTop/Main.svelte';
    import ListByArtist from './components/ListByArtist.svelte';
    import LatestAdditions from './components/LatestAdditions.svelte';
    import RandomSongs from './components/RandomSongs.svelte';
    import type { Chord } from './types';

    export let chords: Chord[];

    let searchString = '';
</script>

<h2>
    Chords
    <span class="pull-right">
        <a href="https://github.com/statox/workshop/actions/workflows/check_chords.yml" target="_blank" rel="noopener noreferrer">
            <button>Check dead links</button>
        </a>
        <a href="https://github.com/statox/blog/issues/105#new_comment_field" target="_blank" rel="noopener noreferrer">
            <button>Add a song</button>
        </a>
    </span>
</h2>

<BackToTop />

<p>This is a list of {chords.length} song chords I have been gathering for the past 10 years and that I like to play.</p>

<LatestAdditions {chords} />
<RandomSongs {chords} />

<div>
    <h3>All chords</h3>
    Search an artist, a title or a tag: <input type="text" bind:value={searchString} >
    <button on:click={() => searchString = ''}>&nbsp✖&nbsp</button>
</div>

<ListByArtist {chords} {searchString} />
