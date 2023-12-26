<script lang="ts">
    import Chords from '$lib/SongBook/Main.svelte';
    import type { Chord } from '$lib/SongBook//types';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { onMount } from 'svelte';
    import { visitCountsStore } from '$lib/SongBook/store';

    // From +page.ts load() function
    export let data: { chords: Chord[] };

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
</script>

<Chords chords={data.chords} />
