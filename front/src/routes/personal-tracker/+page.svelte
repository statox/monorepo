<script lang="ts">
    import { openModal } from '$lib/components/Modal';
    import { user } from '$lib/auth/service';
    import { Notice } from '$lib/components/Notice';
    import EventForm from './components/EventForm.svelte';
</script>

{#if $user}
    <button on:click={() => openModal(EventForm, { onUpload: () => {} })}> Add an entry </button>
{:else}
    <Notice item={{ level: 'info', header: 'Login to add an entry' }} />
{/if}
