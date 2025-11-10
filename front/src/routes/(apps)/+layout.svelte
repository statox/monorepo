<script lang="ts">
    import '$lib/styles/new.css';
    import '$lib/styles/new_theme.css';
    import '$lib/styles/new_override.css';
    import '$lib/styles/highlightjs_gruvbox_dark.css';
    import '$lib/styles/highlightjs_override.css';
    import '$lib/styles/helpers.css';
    import { Modals } from 'svelte-modals';
    import { type Snippet } from 'svelte';
    import { SvelteToast } from '$lib/components/Toast';
    import { Header } from '$lib/components/Header';

    interface Props {
        children?: Snippet;
    }

    let { children }: Props = $props();
</script>

<Header />

<Modals>
    {#snippet backdrop({ closeAll })}
        <!-- Using a button instead of a div to avoid a11y warnings -->
        <button aria-label="backdrop" class="backdrop" onclick={closeAll}></button>
    {/snippet}
</Modals>

<SvelteToast />

{@render children?.()}

<style>
    .backdrop {
        position: fixed;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        background: rgba(0, 0, 0, 0.2);
    }
    .backdrop:enabled:hover {
        background: rgba(0, 0, 0, 0.2);
    }
    :root {
        --toastContainerTop: auto;
        --toastContainerBottom: 2rem;
    }
</style>
