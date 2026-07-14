<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        minWidth: string;
        padding?: string;
        alignLeft?: boolean;
        children: Snippet;
    }
    const { minWidth, padding = '0', alignLeft = false, children }: Props = $props();
</script>

<div
    class="popover-panel"
    style:min-width={minWidth}
    style:padding
    style:left={alignLeft ? '0' : undefined}
>
    {@render children()}
</div>

<style>
    .popover-panel {
        position: absolute;
        z-index: 10;
        top: 100%;
        margin-top: 4px;
        background: var(--nc-bg-1);
        border: 1px solid var(--nc-bg-3);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
</style>
