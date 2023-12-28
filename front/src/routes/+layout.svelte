<script lang="ts">
    import { base } from '$app/paths';
    import '$lib/styles/new.css';
    import '$lib/styles/new_theme.css';
    import '$lib/styles/new_override.css';
    import '$lib/styles/highlightjs_gruvbox_dark.css';
    import '$lib/styles/highlightjs_override.css';
    import '$lib/styles/helpers.css';
    import { Modals, closeModal } from '$lib/components/Modal';
    import { onMount } from 'svelte';
    import { initializeAuth0 } from '$lib/auth/service';
    import { SvelteToast } from '$lib/components/Toast';
    import AuthNavItem from '$lib/auth/AuthNavItem.svelte';

    onMount(async () => {
        await initializeAuth0();
    });
</script>

<header>
    <h1>My Apps</h1>

    <nav>
        <a href="{base}/">Home</a> |
        <AuthNavItem />
    </nav>
</header>

<Modals>
    <!-- Using a button instead of a div to avoid a11y warnings -->
    <button slot="backdrop" class="backdrop" on:click={closeModal} />
</Modals>

<SvelteToast />

<slot />

<style>
    nav {
        display: flex;
        gap: 0.2em;
        align-items: center;
    }
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
