<script lang="ts">
    import { user } from '$lib/auth';
    import { Notice } from '$lib/components/Notice';
    import EventsList from './components/EventsList.svelte';

    import { getAllEvents } from '$lib/PersonalTracker/api';
    import type { PersonalEvent } from '$lib/PersonalTracker/types';
    import { onMount } from 'svelte';
    import { pageNameStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';

    let events: Promise<PersonalEvent[]> | undefined = $state();

    pageNameStore.set('Personal Tracker');

    onMount(() => (events = getAllEvents()));
</script>

{#if $user}
    <div>
        <button onclick={() => goto('/personal-tracker/add')}> Add an entry </button>
    </div>
    <EventsList {events} />
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry or see events' }} />
{/if}
