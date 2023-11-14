<script lang="ts">
    import '$lib/styles/new_theme.css';
    import { onMount } from "svelte";
    import ChordLink from "./ChordLink.svelte";
    import type { Chord } from "../types";

    export let chords: Chord[];

    interface ChordWithTags extends Chord {
        dateTag?: string;
    };

    const now = Date.now() ;
    const oneweek = 1000 * 3600 * 24 * 7;
    const onemonth = oneweek * 4;

    const timeSteps = [
        { label: 'last week', time: now-oneweek},
        { label: 'one month ago', time: now-onemonth},
        { label: 'two monthes ago', time: now-(2 * onemonth)},
        { label: 'six monthes ago', time: now-(6 * onemonth)},
        { label: 'one year ago', time: now-(12 * onemonth)}
    ];

    const chordsWithTags: ChordWithTags[] = chords
    .filter(c => c.creationDate)
    .sort((a, b) => {
        return b.creationDate - a.creationDate;
    })
    .map((chord, index, chords) => {
        const r = {
            ...chord
        } as ChordWithTags;
        if (index > 0) {
            const prev = chords[index-1];
            for (const {time, label} of timeSteps) {
                if (prev.creationDate > time && chord.creationDate < time) {
                    r.dateTag = label;
                }
            }
        }
        return r;
    });

    let nbLatestChords = 6;
    let latestChords: ChordWithTags[] = [];
    const getMoreLatestSongs = () => {
        nbLatestChords += 4;
        latestChords = chordsWithTags.slice(0, nbLatestChords);
    };

    onMount(() => {
        getMoreLatestSongs();
    });
</script>

<div>
    <h3>
        Latest additions
        <button class="pull-right" on:click={() => getMoreLatestSongs()}>More...</button>
    </h3>
    <ul class="ul2col-container">
        {#each latestChords as chord}
            {#if chord.dateTag}
                <li class="ul2col-separator">{chord.dateTag}</li>
            {/if}
            <li class="ul2col-item">
                <ChordLink {chord} />
            </li>
        {/each}
    </ul>
</div>

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

    .ul2col-separator {
        font-size:small;
        color: var(--nc-tx-3);
        flex: 1 0 100%;
        list-style-type: none;
    }
}
</style>
