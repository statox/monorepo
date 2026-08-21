<script lang="ts">
    interface Props {
        saveAction: () => void | Promise<void>;
        disabled?: boolean;
    }

    let { saveAction, disabled = false }: Props = $props();
</script>

<button aria-label="save" class="save-button" onclick={saveAction} title="Save" {disabled}>
    <i class="fas fa-check"></i>
</button>

<style>
    .save-button {
        font-size: 1em;
        background: var(--nc-success);
        color: var(--nc-white);
    }
</style>
