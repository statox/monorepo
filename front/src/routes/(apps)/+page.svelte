<script lang="ts">
    import { allApps, AppsList } from '$lib/components/AppsList';
    import { pageNameStore } from '$lib/components/Header';
    pageNameStore.set('My Apps');
</script>

<AppsList sections={allApps} />
