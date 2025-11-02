<script lang="ts">
    import { modals } from 'svelte-modals';
    import { user } from '$lib/auth2';
    import { Notice } from '$lib/components/Notice';
    import EventForm from './components/EventForm.svelte';
    import EventsList from './components/EventsList.svelte';

    import { getAllEvents } from '$lib/PersonalTracker/api';
    import type { PersonalEvent } from '$lib/PersonalTracker/types';
    import { onMount } from 'svelte';

    let events: Promise<PersonalEvent[]> | undefined = $state();

    const refreshData = () => (events = getAllEvents());
    onMount(() => (events = getAllEvents()));
</script>

{#if $user}
    <div>
        <button onclick={() => modals.open(EventForm, { onUpload: refreshData })}>
            Add an entry
        </button>
    </div>
    <EventsList {events} />
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry or see events' }} />
{/if}
