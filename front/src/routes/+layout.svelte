<script lang="ts">
    import { base } from '$app/paths';
</script>
<header>
    <h1>Workshop</h1>

    <nav>
        <a href="{base}/">Home</a> |
        <a href="{base}/notes">Notes</a> |
    </nav>
</header>

<slot />
