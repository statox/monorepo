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
    };
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
        <br />
        <LunarCycle {upcomingLunarStates} />
        <br />
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
