<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    type State = 'initial' | 'triggered' | 'confirmed';
    let state: State = 'initial';
    let resetStateTimeout: ReturnType<typeof setTimeout>;
    const RESET_TIMEOUT_SECONDS = 5;

    const dispatch = createEventDispatcher();
    const trigger = () => {
        state = 'triggered';
        resetStateTimeout = setTimeout(reset, RESET_TIMEOUT_SECONDS * 1000);
    };
    const confirmDelete = () => {
        clearTimeout(resetStateTimeout);
        state = 'confirmed';
        dispatch('delete');
    };
    const reset = () => {
        state = 'initial';
    };
</script>

{#if state === 'initial'}
    <button class="delete-button" on:click={trigger} title="Delete?">
        <i class="fas fa-trash-alt"></i>
    </button>
{:else if state === 'triggered'}
    <button class="delete-button" on:click={confirmDelete} title="Confirm deletion">
        <i class="fas fa-trash-alt"></i>
        <i class="fas fa-question"></i>
    </button>
{:else if state === 'confirmed'}
    <button class="delete-button" title="Deleted" disabled>
        <i class="fas fa-trash-alt"></i>
        <i class="fas fa-check"></i>
    </button>
{/if}

<style>
    .delete-button {
        font-size: 1em;
        background: var(--nc-error);
        color: var(--nc-white);
    }
</style>
