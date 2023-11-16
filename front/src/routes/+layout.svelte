<script lang="ts">
    import { base } from '$app/paths';
    import '$lib/styles/new.css';
    import '$lib/styles/new_theme.css';
    import '$lib/styles/new_override.css';
    import '$lib/styles/highlightjs_gruvbox_dark.css';
    import '$lib/styles/highlightjs_override.css';
    import '$lib/styles/helpers.css';
</script>

<header>
    <h1>Workshop</h1>

    <nav>
        <a href="{base}/">Home</a> |
        <a href="{base}/notes">Notes</a> |
        <a href="{base}/chords">Chords</a> |
        <a href="{base}/monitoring">Monitoring</a> |
    </nav>
</header>

<slot />
