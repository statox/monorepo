<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageNameStore } from '$lib/components/Header';
    import Ephemerides from './components/Ephemerides.svelte';

    pageNameStore.set('Ephemerides');
</script>

<HeadIOS title="Ephemerides" description="Get the ephemerides" />

<div class="content">
    <Ephemerides />
</div>

<style>
    .content {
        display: flex;
        flex-flow: column;
        row-gap: 2em;
    }
</style>
