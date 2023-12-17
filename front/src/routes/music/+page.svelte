<script lang="ts">
    import { goto } from "$app/navigation";

</script>

<div class="container">
    <button class="app" on:click={() => goto('/songbook')}>
        <h2>Song Book</h2>
        <div class="description">
            The list of my guitar tablatures
        </div>
    </button>
    <button class="app" on:click={() => goto('/metronome')}>
        <h2>Metronome</h2>
        <div class="description">
            Never miss a beat
        </div>
    </button>
    <button class="app" on:click={() => goto('/scales')}>
        <h2>Scales</h2>
        <div class="description">
            A tool to visualize music scales and common chords progressions
        </div>
    </button>
    <button class="app" on:click={() => goto('/chordwheel')}>
        <h2>Chord Wheel</h2>
        <div class="description">
            A tool to find the key of a song and work with scale degrees
        </div>
    </button>
    <button class="app" on:click={() => goto('/taptempo')}>
        <h2>Tap Tempo</h2>
        <div class="description">
            Find a tempo by tapping it on the screen or the keyboard
        </div>
    </button>
</div>

<style>
    .container {
        display: flex;
        justify-content: space-evenly;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 3em;
    }

    .app {
        flex: 1;
        min-width: 300px;
        min-height: 300px;
        background-color: var(--nc-bg-2);
        white-space: normal;
        border-radius: 5%;
    }

    .description {
        color: var(--nc-tx-1);
    }

</style>
