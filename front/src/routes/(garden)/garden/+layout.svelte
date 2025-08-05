<script lang="ts">
    import '$lib/styles/new.css';
    import '$lib/styles/new_theme.css';
    import '$lib/styles/new_override.css';
    import { onMount, type Snippet } from 'svelte';

    interface Props {
        children?: Snippet;
    }
    let { children }: Props = $props();

    onMount(() => {
        // For now always set dark mode.
        // TODO maybe add ThemeSwitcherNavItem component later
        const htmlElement = document.documentElement;
        htmlElement.dataset.theme = 'dark';
    });
</script>

{@render children?.()}
