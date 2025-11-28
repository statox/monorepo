<script lang="ts">
    import { allApps, AppsList } from '$lib/components/AppsList';
    import { pageMetadataStore } from '$lib/components/Header';
    pageMetadataStore.set({
        name: 'My Apps',
        iconPath: '/favicon.png',
        showAuthInHeader: true
    });
</script>

<AppsList sections={allApps} />
