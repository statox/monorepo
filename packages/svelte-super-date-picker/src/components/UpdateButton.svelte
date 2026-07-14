<script lang="ts">
    interface Props {
        needsUpdate: boolean;
        isLoading: boolean;
        isDisabled: boolean;
        onClick: () => void;
    }
    const { needsUpdate, isLoading, isDisabled, onClick }: Props = $props();

    const label = $derived(isLoading ? 'Updating' : needsUpdate ? 'Update' : 'Refresh');
</script>

<button
    type="button"
    class="update-button"
    class:update-button--needs-update={needsUpdate || isLoading}
    disabled={isDisabled}
    onclick={onClick}
>
    <i class="fas {needsUpdate || isLoading ? 'fa-play' : 'fa-sync-alt'}"></i>
    {label}
</button>

<style>
    .update-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--nc-ac-1);
        color: var(--nc-ac-tx);
        border: none;
        cursor: pointer;
    }

    .update-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
