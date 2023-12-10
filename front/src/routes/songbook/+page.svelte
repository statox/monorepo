<script lang="ts">
    import Chords from '$lib/SongBook/Main.svelte';
    import type { Chord } from '$lib/SongBook//types';

    // From +page.ts load() function
    export let data: { chords: Chord[] };
</script>

<Chords chords={data.chords} />
