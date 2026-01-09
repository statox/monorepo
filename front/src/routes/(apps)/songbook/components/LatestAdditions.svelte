<script lang="ts">
    import { onMount } from 'svelte';
    import ChordLink from './ChordLink.svelte';
    import type { Chord } from '$lib/Songbook';

    interface Props {
        chords: Chord[];
    }

    let { chords }: Props = $props();

    interface ChordWithTags extends Chord {
        dateTag?: string;
    }

    const now = Date.now();
    const oneweek = 1000 * 3600 * 24 * 7;
    const onemonth = oneweek * 4;

    const timeSteps = [
        { label: 'last week', time: now - oneweek },
        { label: 'one month ago', time: now - onemonth },
        { label: 'two months ago', time: now - 2 * onemonth },
        { label: 'six months ago', time: now - 6 * onemonth },
        { label: 'one year ago', time: now - 12 * onemonth }
    ];

    const chordsWithTags: ChordWithTags[] = $derived(
        chords
            .filter((c) => c.creationDate)
            .sort((a, b) => {
                return b.creationDate - a.creationDate;
            })
            .map((chord, index, chords) => {
                const r = {
                    ...chord
                } as ChordWithTags;
                if (index > 0) {
                    const prev = chords[index - 1];
                    for (const { time, label } of timeSteps) {
                        if (prev.creationDate > time && chord.creationDate < time) {
                            r.dateTag = label;
                        }
                    }
                }
                return r;
            })
    );

    let nbLatestChords = 6;
    let latestChords: ChordWithTags[] = $state([]);
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
        <button class="pull-right" onclick={() => getMoreLatestSongs()}>More...</button>
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
