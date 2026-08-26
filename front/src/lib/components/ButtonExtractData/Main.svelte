<script lang="ts">
    interface Props {
        extractAction: () => void | Promise<void>;
        loading?: boolean;
        disabled?: boolean;
    }

    let { extractAction, loading = false, disabled = false }: Props = $props();
</script>

<button
    aria-label="extract data"
    class="extract-button"
    onclick={extractAction}
    title="Extract data"
    disabled={disabled || loading}
>
    {#if loading}
        <i class="fas fa-spinner fa-spin"></i>
    {:else}
        <i class="fas fa-download"></i>
    {/if}
</button>

<style>
    .extract-button {
        font-size: 1em;
    }
</style>
