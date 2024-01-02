<script lang="ts">
    import { visitCountsStore } from '../../store';
    import '$lib/styles/new_theme.css';
    import type { Chord, ChordData, Filters } from '../../types';
    import ChordLink from '../ChordLink.svelte';

    export let searchString: string;
    export let chords: Chord[];
    export let filters: Filters;

    let chordsData: Map<string, ChordData>;
    visitCountsStore.subscribe((visitCountsMap) => {
        if (!visitCountsMap) {
            return;
        }
        chordsData = visitCountsMap;
        chords = chords.sort((a, b) => {
            const dataA = visitCountsMap.get(a.url);
            const dataB = visitCountsMap.get(b.url);

            if (dataA && dataB) {
                return dataB.lastAccessDateUnix - dataA.lastAccessDateUnix;
            } else if (dataA) {
                return -1;
            } else if (dataB) {
                return 1;
            }

            if (a.artist != b.artist) {
                return a.artist.toLowerCase() < b.artist.toLowerCase() ? -1 : 1;
            }

            return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
        });
    });

    const shouldDisplayChord = (chord: Chord, searchString: string, filters: Filters) => {
        if (filters[chord.type] === false) {
            return false;
        }
        if (searchString.length === 0) {
            return true;
        }
        if (chord.artist.toLowerCase().match(searchString.toLowerCase())) {
            return true;
        }
        return chord.title.toLowerCase().match(searchString.toLowerCase());
    };
</script>

{#key chords}
    <ul class="ul2col-container">
        {#each chords as chord}
            {@const data = chordsData.get(chord.url)}
            {#if shouldDisplayChord(chord, searchString, filters)}
                <li class="ul2col-item">
                    {#if data}({data.count}){/if}
                    <ChordLink {chord} showArtist={true} />
                </li>
            {/if}
        {/each}
    </ul>
{/key}
