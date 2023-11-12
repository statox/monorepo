<script lang="ts">
    import type { Chord } from './types';
    export let chords: Chord[];
</script>

<h2>Chords</h2>

<ul>
    {#each chords as chord}
    <li>
        <a href={chord.url} target="_blank" rel="noopener noreferrer">{chord.title}</a>
    </li>
    {/each}
</ul>
