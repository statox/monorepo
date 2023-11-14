<script lang="ts">
    import Chords from '$lib/Chords/Main.svelte'
    import type { Chord } from '$lib/Chords//types';

    // From +page.ts load() function
    export let data: { chords: Chord[] };
</script>

<Chords chords={data.chords} />
