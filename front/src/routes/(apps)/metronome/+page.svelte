<script lang="ts">
    import Metronome from './components/Metronome.svelte';
    import InfoPanel from './components/InfoPanel.svelte';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageMetadataStore } from '$lib/components/Header';

    pageMetadataStore.set({ name: 'Metronome' });
</script>

<HeadIOS title="Metronome" description="Metronome" />

<div class="container">
    <InfoPanel />
    <Metronome />
</div>

<style>
    .container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }
</style>
