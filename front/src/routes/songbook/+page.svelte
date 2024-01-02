<script lang="ts">
    import { openModal } from '$lib/components/Modal';
    import BackToTop from '$lib/components/BackToTop/Main.svelte';
    import HeadIOS from '$lib/components/HeadIOS/Main.svelte';
    import { ListByArtist, ListByTags, ListByVisitsCounts } from './components/views';
    import ChordsChecks from './components/ChordsChecks.svelte';
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

    const views = [
        { label: 'By artist', component: ListByArtist },
        { label: 'By tags', component: ListByTags },
        { label: 'By frequency', component: ListByVisitsCounts }
    ];
    let currentView = views[0];
</script>

<HeadIOS title="Song Book" description="My song book" />

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
        {#each views as option}
            <button class:selected={currentView === option} on:click={() => (currentView = option)}>
                {option.label}
            </button>
        {/each}
    </div>
</div>

<svelte:component this={currentView.component} {chords} {searchString} />

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
