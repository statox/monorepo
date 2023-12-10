<script lang="ts">
    import { openModal } from '$lib/components/Modal';
    import BackToTop from '$lib/components/BackToTop/Main.svelte';
    import ChordsChecks from './components/ChordsChecks.svelte';
    import ListByArtist from './components/ListByArtist.svelte';
    import ListByTags from './components/ListByTags.svelte';
    import LatestAdditions from './components/LatestAdditions.svelte';
    import RandomSongs from './components/RandomSongs.svelte';
    import type { Chord } from './types';

    export let chords: Chord[];

    let searchString = '';

    let view: 'listByArtist' | 'listByTags' = 'listByArtist';
    const views = {
        listByArtist: ListByArtist,
        listByTags: ListByTags
    };
</script>

<h2>
    Song book
    <span class="pull-right">
        <button style:position="relative" on:click={() => openModal(ChordsChecks)}>
            Check dead links
        </button>

        <a
            href="https://github.com/statox/blog/issues/105#new_comment_field"
            target="_blank"
            rel="noopener noreferrer"
        >
            <button>Add a song</button>
        </a>
    </span>
</h2>

<BackToTop />

<p>
    This is a list of {chords.length} song chords I have been gathering for the past 10 years and that
    I like to play.
</p>

<LatestAdditions {chords} />
<RandomSongs {chords} />

<div>
    <h3>All songs</h3>
    Search an artist, a title or a tag:<input type="text" bind:value={searchString} />
    <button on:click={() => (searchString = '')}>&nbsp✖&nbsp</button>
    <button
        class="pull-right"
        on:click={() => (view = view === 'listByTags' ? 'listByArtist' : 'listByTags')}
        >Change view</button
    >
</div>

<svelte:component this={views[view]} {chords} {searchString} />
