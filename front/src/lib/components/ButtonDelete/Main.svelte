<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    type State = 'initial' | 'triggered' | 'confirmed';
    let state: State = 'initial'

    const dispatch = createEventDispatcher();
    const confirmDelete = () => {
        state = 'confirmed';
        dispatch('delete');
    };
</script>

{#if state === 'initial'}
    <button class="delete-button" on:click={() => state = 'triggered'} title="Delete?">
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
        background: red;
        color: white;
    }
</style>
