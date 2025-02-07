<script lang="ts">
    type ButtonState = 'initial' | 'triggered' | 'confirmed';
    const RESET_TIMEOUT_SECONDS = 5;
    let buttonState: ButtonState = $state('initial');
    let resetButtonStateTimeout: ReturnType<typeof setTimeout>;

    interface Props {
        deleteAction: () => void | Promise<void>;
    }
    let { deleteAction }: Props = $props();

    const trigger = () => {
        buttonState = 'triggered';
        resetButtonStateTimeout = setTimeout(reset, RESET_TIMEOUT_SECONDS * 1000);
    };
    const confirmDelete = async () => {
        clearTimeout(resetButtonStateTimeout);
        buttonState = 'confirmed';
        await deleteAction();
        buttonState = 'initial';
    };
    const reset = () => {
        buttonState = 'initial';
    };
</script>

{#if buttonState === 'initial'}
    <button aria-label="delete" class="delete-button" onclick={trigger} title="Delete?">
        <i class="fas fa-trash-alt"></i>
    </button>
{:else if buttonState === 'triggered'}
    <button
        aria-label="confirm delete"
        class="delete-button"
        onclick={confirmDelete}
        title="Confirm deletion"
    >
        <i class="fas fa-trash-alt"></i>
        <i class="fas fa-question"></i>
    </button>
{:else if buttonState === 'confirmed'}
    <button aria-label="delete success" class="delete-button" title="Deleted" disabled>
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
