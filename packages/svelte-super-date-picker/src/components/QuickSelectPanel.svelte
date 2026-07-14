<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        title?: string;
        children: Snippet;
    }
    const { title, children }: Props = $props();
</script>

<fieldset class="quick-select-panel">
    {#if title}
        <legend>{title}</legend>
    {/if}
    {@render children()}
</fieldset>

<style>
    .quick-select-panel {
        border: none;
        padding: 0;
        margin: 0 0 12px 0;
    }

    .quick-select-panel legend {
        font-size: 0.8rem;
        font-weight: bold;
        color: var(--nc-tx-2);
        text-transform: uppercase;
        padding: 0;
        margin-bottom: 6px;
    }
</style>
