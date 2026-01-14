<script lang="ts">
    import { getEphemerides } from '$lib/HomeTracker';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { pageMetadataStore } from '$lib/components/Header';
    import { Notice } from '$lib/components/Notice';
    import Ephemerides from './components/Ephemerides.svelte';
    import LunarCycle from './components/LunarCycle.svelte';

    const pageMetadata = {
        name: 'Ephemerides',
        description: 'Get the ephemerides',
        iconPath: '/ephemerides.png'
    } as const;
    pageMetadataStore.set(pageMetadata);
</script>

<HeadIOS
    title={pageMetadata.name}
    description={pageMetadata.description}
    iconPath={pageMetadata.iconPath}
/>

<div class="content">
    {#await getEphemerides()}
        <p>Loading ephemerides data</p>
    {:then { moonState, sunState, upcomingLunarStates }}
        <Ephemerides {moonState} {sunState} />
        <div class="separator"></div>
        <LunarCycle {upcomingLunarStates} />
        <div class="separator"></div>
        <Notice item={{ level: 'info', message: 'All data is computed for Paris, France' }} />
    {:catch error}
        <Notice
            item={{
                level: 'error',
                header: 'Something went wrong getting ephemerides data',
                message: error
            }}
        />
    {/await}
</div>

<style>
    .separator {
        background-color: var(--nc-ac-1);
        height: 1px;
        margin: 1em;
    }
</style>
