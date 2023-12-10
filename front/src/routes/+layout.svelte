<script lang="ts">
    import { base } from '$app/paths';
    import '$lib/styles/new.css';
    import '$lib/styles/new_theme.css';
    import '$lib/styles/new_override.css';
    import '$lib/styles/highlightjs_gruvbox_dark.css';
    import '$lib/styles/highlightjs_override.css';
    import '$lib/styles/helpers.css';
    import { Modals, closeModal } from '$lib/components/Modal';
</script>

<header>
    <h1>Workshop</h1>

    <nav>
        <a href="{base}/">Home</a> |
        <a href="{base}/notes">Notes</a> |
        <a href="{base}/songbook">Song book</a> |
        <a href="{base}/scales">Scales</a> |
        <a href="{base}/chordwheel">Chord Wheel</a> |
        <a href="{base}/taptempo">Tap Tempo</a> |
        <a href="{base}/metronome">Metronome</a> |
    </nav>
</header>

<Modals>
    <!-- Using a button instead of a div to avoid a11y warnings -->
    <button slot="backdrop" class="backdrop" on:click={closeModal} />
</Modals>

<slot />

<style>
    .backdrop {
        position: fixed;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        background: rgba(0, 0, 0, 0.2);
    }
    .backdrop:enabled:hover {
        background: rgba(0, 0, 0, 0.2);
    }
</style>
