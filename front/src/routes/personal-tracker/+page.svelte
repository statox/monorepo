<script lang="ts">
    import { openModal } from '$lib/components/Modal';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import EventForm from './components/EventForm.svelte';
    import EventsList from './components/EventsList.svelte';

    import { getAllEvents } from '$lib/PersonalTracker/api';
    import type { PersonalEvent } from '$lib/PersonalTracker/types';
    import { onMount } from 'svelte';

    let events: Promise<PersonalEvent[]>;

    const refreshData = () => (events = getAllEvents());
    onMount(() => (events = getAllEvents()));
</script>

{#if $user}
    <div>
        <button on:click={() => openModal(EventForm, { onUpload: refreshData })}>
            Add an entry
        </button>
    </div>
    <EventsList {events} />
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry or see events' }} />
{/if}
