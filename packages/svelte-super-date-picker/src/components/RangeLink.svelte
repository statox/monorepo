<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        onClick: () => void;
        children: Snippet;
    }
    const { onClick, children }: Props = $props();
</script>

<button type="button" class="range-link" onclick={onClick}>
    {@render children()}
</button>

<style>
    .range-link {
        background: none;
        border: none;
        padding: 0;
        color: var(--nc-lk-1);
        cursor: pointer;
        text-align: left;
        font-size: 0.9rem;
    }

    .range-link:hover {
        text-decoration: underline;
    }
</style>
