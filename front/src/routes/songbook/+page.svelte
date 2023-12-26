<script lang="ts">
    import { openModal } from '$lib/components/Modal';
    import BackToTop from '$lib/components/BackToTop/Main.svelte';
    import ChordsChecks from './components/ChordsChecks.svelte';
    import ListByArtist from './components/ListByArtist.svelte';
    import ListByTags from './components/ListByTags.svelte';
    import ListByVisitsCounts from './components/ListByVisitsCounts.svelte';
    import LatestAdditions from './components/LatestAdditions.svelte';
    import RandomSongs from './components/RandomSongs.svelte';
    import type { Chord } from './types';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { visitCountsStore } from './store';

    // From +page.ts load() function
    export let data: { chords: Chord[] };
    const { chords } = data;

    onMount(() => {
        const COUNTS_URL = PUBLIC_API_URL + '/chords/getLinksVisitsCount';
        fetch(COUNTS_URL)
            .then((response) => response.json())
            .then((countsData) => {
                const counts: any = countsData.reduce((counts: any, count: any) => {
                    counts.set(count.url, {
                        ...count
                    });
                    return counts;
                }, new Map());

                visitCountsStore.set(counts);
            });
    });

    let searchString = '';

    let view: 'listByArtist' | 'listByTags' | 'listByVisitsCount' = 'listByArtist';
    const views = {
        listByArtist: ListByArtist,
        listByTags: ListByTags,
        listByVisitsCount: ListByVisitsCounts
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
    <div class="view-controls">
        <button
            class:selected={view === 'listByArtist'}
            class="pull-right"
            on:click={() => (view = 'listByArtist')}
        >
            By artists
        </button>
        <button
            class:selected={view === 'listByTags'}
            class="pull-right"
            on:click={() => (view = 'listByTags')}
        >
            By tags
        </button>
        <button
            class:selected={view === 'listByVisitsCount'}
            class="pull-right"
            on:click={() => (view = 'listByVisitsCount')}
        >
            By visits count
        </button>
    </div>
</div>

<svelte:component this={views[view]} {chords} {searchString} />

<style>
    .view-controls {
        display: flex;
        gap: 0.1em;
    }

    button.selected {
        background-color: var(--nc-lk-2);
        font-weight: bold;
    }
</style>
