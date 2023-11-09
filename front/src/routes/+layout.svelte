<script lang="ts">
    import { base } from '$app/paths';
    import '$lib/styles/new.css';
    import '$lib/styles/new_theme.css';
</script>

<header>
    <h1>Workshop</h1>

    <nav>
        <a href="{base}/">Home</a> |
        <a href="{base}/notes">Notes</a> |
    </nav>
</header>

<slot />
