<script lang="ts">
    import BackToTop from '$lib/components/BackToTop/Main.svelte';
    import ChordsChecks from './components/ChordsChecks.svelte';
    import ListByArtist from './components/ListByArtist.svelte';
    import ListByTags from './components/ListByTags.svelte';
    import LatestAdditions from './components/LatestAdditions.svelte';
    import RandomSongs from './components/RandomSongs.svelte';
    import type { Chord } from './types';

    export let chords: Chord[];
    export let lastChordsCheck: any;

    const chordsChecksIcons = {
        'error': 'fa fa-question-circle-o',
        'failures':  'fa fa-exclamation-circle',
        'ok': 'fa fa-check-circle'
    };
    const getChordsCheckStatus = () => {
        if (!lastChordsCheck) {
            return 'error';
        }
        if (lastChordsCheck.nbFails > 0) {
            return 'failures';
        }
        return 'ok'
    };

    let showChordsChecks = false;
    const chordsCheckIcon = chordsChecksIcons[getChordsCheckStatus()];

    let searchString = '';

    let view: 'listByArtist' | 'listByTags' = 'listByArtist';
    const views={
        'listByArtist': ListByArtist,
        'listByTags': ListByTags
    }
</script>

<h2>
    Song book
    <span class="pull-right">
        <button style:position='relative' on:click={() => showChordsChecks = !showChordsChecks}>
            Dead links
            {#if lastChordsCheck?.nbFails > 0}
                ({ lastChordsCheck.nbFails })
            {/if}
            <span class={chordsCheckIcon}></span>
        </button>

        <a href="https://github.com/statox/blog/issues/105#new_comment_field" target="_blank" rel="noopener noreferrer">
            <button>Add a song</button>
        </a>
    </span>
</h2>

<BackToTop />

<p>This is a list of {chords.length} song chords I have been gathering for the past 10 years and that I like to play.</p>

{#if showChordsChecks}
<ChordsChecks {lastChordsCheck} />
{/if}
<LatestAdditions {chords} />
<RandomSongs {chords} />

<div>
    <h3>All songs</h3>
    Search an artist, a title or a tag: <input type="text" bind:value={searchString} >
    <button on:click={() => searchString = ''}>&nbsp✖&nbsp</button>
    <button class="pull-right" on:click={() => view = view === 'listByTags' ? 'listByArtist' : 'listByTags'}>Change view</button>
</div>


<svelte:component this={views[view]}  {chords} {searchString}/>

<style>
.fa-exclamation-circle {
    color: #E82236;
}

.fa-check-circle {
    color: #89E07D;
}

.btn-overlay {
    position: absolute;
    padding: 0;
    top: -100%;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #ffffff;
    transition: opacity .5s;
}
</style>
