<script lang="ts">
    import { openModal } from '$lib/components/Modal';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import EventForm from './components/EventForm.svelte';
    import EventsList from './components/EventsList.svelte';
</script>

{#if $user}
    <button on:click={() => openModal(EventForm, { onUpload: () => {} })}> Add an entry </button>
    <br />
    <EventsList />
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry or see events' }} />
{/if}
