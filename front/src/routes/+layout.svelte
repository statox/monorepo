<script lang="ts">
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
    import HomeNavItem from '$lib/components/NavItems/HomeNavItem.svelte';
    import AuthNavItem from '$lib/components/NavItems/AuthNavItem.svelte';

    let auth0Error: Error;
    onMount(async () => {
        try {
            await initializeAuth0();
        } catch (error: any) {
            auth0Error = error;
        }
    });
</script>

<header>
    <h1>
        <span>My Apps</span>
        <nav>
            <HomeNavItem />
            <AuthNavItem />
        </nav>
    </h1>
</header>

<Modals>
    <!-- Using a button instead of a div to avoid a11y warnings -->
    <button slot="backdrop" class="backdrop" on:click={closeModal} />
</Modals>

<SvelteToast />

<!-- TODO: this error display is just a try while reworking authentication  -->
<!-- 1. The errors thrown by initializeAuth0() might not really happen or not be relevant -->
<!-- 2. It might be better to use svelte built-in page error mecanism that I'm not familiar with already -->
{#if auth0Error}
    <div class="auth-error">
        <div>Something went wrong with auth0 setup</div>
        <div>
            {auth0Error}
        </div>
    </div>
{/if}

<slot />

<style>
    nav {
        display: inline-flex;
        flex-direction: row;
        gap: 0.3em;
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
    .auth-error {
        background-color: #830707;
    }
</style>
