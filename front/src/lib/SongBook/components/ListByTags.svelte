<script lang="ts">
    import { alphaLowerSort } from '$lib/helpers';
    import '$lib/styles/new_theme.css';
    import type { Chord } from '../types';
    import ChordLink from './ChordLink.svelte';

    export let searchString: string;
    export let chords: Chord[];

    const formatTag = (t: string) => {
        return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    };

    const chordsByTags: {
        [tag: string]: Chord[];
    } = {};

    for (const chord of chords) {
        const tags = chord.tags;
        tags.forEach((tag: string) => {
            if (!chordsByTags[tag]) {
                chordsByTags[tag] = [];
            }
            chordsByTags[tag].push(chord);
        });
    }

    Object.keys(chordsByTags).forEach((tag) => {
        chordsByTags[tag].sort((a, b) => {
            const artisteA = a.artist.toLowerCase();
            const artisteB = b.artist.toLowerCase();
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();

            if (artisteA < artisteB) {
                return -1;
            }
            if (artisteA > artisteB) {
                return 1;
            }
            if (titleA < titleB) {
                return -1;
            }
            return 1;
        });
    });

    console.log(chordsByTags);
</script>

{#each Object.keys(chordsByTags).sort(alphaLowerSort) as tag}
    {#if searchString.length === 0 || tag.toLowerCase().match(searchString.toLowerCase())}
        <div>
            <span>{formatTag(tag)}</span>
            <ul class="ul2col-container">
                {#each chordsByTags[tag] as chord}
                    <li class="ul2col-item">
                        <ChordLink {chord} showArtist={true} />
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
{/each}
