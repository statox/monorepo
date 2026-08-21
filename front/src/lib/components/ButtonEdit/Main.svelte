<script lang="ts">
    interface Props {
        editAction: () => void | Promise<void>;
        disabled?: boolean;
    }

    let { editAction, disabled = false }: Props = $props();
</script>

<button aria-label="edit" class="edit-button" onclick={editAction} title="Edit" {disabled}>
    <i class="fas fa-pen"></i>
</button>

<style>
    .edit-button {
        font-size: 1em;
    }
</style>
