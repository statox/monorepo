<script lang="ts">
    import '$lib/styles/new_theme.css';
    import { alphaLowerSort } from '$lib/helpers';
    import ChordLink from '../ChordLink.svelte';
    import type { Chord, Filters } from '../../types';

    export let searchString: string;
    export let chords: Chord[];
    export let filters: Filters;

    type ChordsByArtist = {
        [artist: string]: Chord[];
    };

    const chordsByArtist = chords.reduce((byArtist, chord) => {
        const artist = chord.artist;
        if (!byArtist[artist]) {
            byArtist[artist] = [];
        }
        byArtist[artist].push(chord);
        return byArtist;
    }, {} as ChordsByArtist);

    const tags: { letter: string; tag: string }[] = [];
    const artistsList = Object.keys(chordsByArtist)
        .sort(alphaLowerSort)
        .map((artist, index, list) => {
            if (index === 0 || artist[0].toLowerCase() != list[index - 1][0].toLowerCase()) {
                const tag = 'anchor_letter_' + artist[0];
                tags.push({ letter: artist[0], tag });
                return { name: artist, tag };
            }
            return { name: artist };
        });

    let y: number;
    let barTop: number = 0;
    let tableElement: HTMLElement;

    const onScroll = (_y: number) => {
        if (!tableElement) {
            return;
        }
        var rect = tableElement.getBoundingClientRect();

        if (rect.top < 20) {
            barTop = 20;
            return;
        }

        barTop = rect.top;
    };

    $: onScroll(y);

    const getArtistFilteredChords = (artist: string, searchString: string, filters: Filters) => {
        const chords = chordsByArtist[artist]
            .sort((a, b) => (a.title < b.title ? -1 : 1))
            .filter((chord) => {
                const type = chord.type;
                if (filters[type] === false) {
                    return false;
                }
                if (searchString.length === 0) {
                    return true;
                }
                const chordTags = artist + ';' + chord.title + ';' + chord.tags.join(',');
                return chordTags.toLowerCase().match(searchString.toLowerCase());
            });
        return chords;
    };

    const shouldDisplayArtist = (
        artist: string,
        chords: Chord[],
        searchString: string,
        filters: Filters
    ) => {
        if (chords.length === 0) {
            return false;
        }
        if (searchString.length === 0) {
            return true;
        }
        const artistTags =
            artist +
            ';' +
            chords.reduce((tags, chord) => tags + chord.title + ';' + chord.tags.join(','), '');
        return artistTags.toLowerCase().match(searchString.toLowerCase());
    };
</script>

<svelte:window bind:scrollY={y} />

<ol id="indexList" class="navigationBar disable-scrollbars" style:--barTop="{barTop}px">
    {#each tags as tag}
        <li class="navigationBtn">
            <a href={'#' + tag.tag} class="navigationLink">
                {tag.letter.toUpperCase()}
            </a>
        </li>
    {/each}
</ol>

<table bind:this={tableElement} id="artistTable">
    {#each artistsList as artist}
        {@const chords = getArtistFilteredChords(artist.name, searchString, filters)}

        {#if shouldDisplayArtist(artist.name, chords, searchString, filters)}
            <tr>
                <td id={artist.tag}>
                    {artist.name}
                    <ul class="ul2col-container">
                        {#each chords as chord}
                            <li class="ul2col-item">
                                <ChordLink {chord} />
                            </li>
                        {/each}
                    </ul>
                </td>
            </tr>
        {/if}
    {/each}
</table>

<style>
    td {
        border: none;
    }

    tr {
        border-bottom: solid thin;
        border-bottom-color: var(--nc-bg-3);
    }

    .navigationBar {
        position: fixed;
        z-index: 1000;
        width: 50px;
        top: var(--barTop);
        bottom: 10px;
        right: 10px;
        padding-right: 5px;
        padding-left: 5px;
        background: var(--nc-bg-1);
        list-style: none;
        overflow-x: auto;
        display: inline-block;
        border: 1px solid;
        border-radius: 5px;
        border-color: var(--nc-bg-2);
    }

    .navigationBtn {
        background: var(--nc-bg-3);
        text-align: center;
        height: 50px;
        width: 50px;
        border-radius: 5px;
    }

    .navigationLink {
        display: inline-block;
        height: 40px;
        width: 40px;
        line-height: 50px;
        font-weight: bold;
    }
</style>
