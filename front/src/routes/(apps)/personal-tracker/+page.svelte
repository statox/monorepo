<script lang="ts">
    import { user } from '$lib/auth';
    import { HeadIOS } from '$lib/components/HeadIOS';
    import { Notice } from '$lib/components/Notice';
    import EventsList from './components/EventsList.svelte';

    import { getAllEvents } from '$lib/PersonalTracker/api';
    import type { PersonalEvent } from '$lib/PersonalTracker/types';
    import { onMount } from 'svelte';
    import { pageMetadataStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';

    let events: Promise<PersonalEvent[]> | undefined = $state();

    const pageMetadata = {
        name: 'Personal Tracker',
        description: 'Track me metrics',
        iconPath: '/personal_tracker.png',
        showAuthInHeader: true
    } as const;
    pageMetadataStore.set(pageMetadata);

    onMount(() => (events = getAllEvents()));
</script>

<HeadIOS
    title={pageMetadata.name}
    description={pageMetadata.description}
    iconPath={pageMetadata.iconPath}
/>

{#if $user}
    <div>
        <button onclick={() => goto('/personal-tracker/add')}> Add an entry </button>
    </div>
    <EventsList {events} />
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry or see events' }} />
{/if}
