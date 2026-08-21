<script lang="ts">
    interface Props {
        cancelAction: () => void | Promise<void>;
        disabled?: boolean;
    }

    let { cancelAction, disabled = false }: Props = $props();
</script>

<button aria-label="cancel" class="cancel-button" onclick={cancelAction} title="Cancel" {disabled}>
    <i class="fas fa-times"></i>
</button>

<style>
    .cancel-button {
        font-size: 1em;
    }
</style>
