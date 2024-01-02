<script lang="ts">
    import AppsList from '$lib/components/AppsList/Main.svelte';
    import { allApps } from '$lib/components/AppsList/apps';
</script>

<AppsList sections={allApps} />
