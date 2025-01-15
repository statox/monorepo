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
    import { Notice } from '$lib/components/Notice';
    import { Header } from '$lib/components/Header';

    let auth0Error: Error;
    onMount(async () => {
        try {
            await initializeAuth0();
        } catch (error: any) {
            auth0Error = error;
        }
    });
</script>

<Header />

<Modals>
    {#snippet backdrop()}
        <!-- Using a button instead of a div to avoid a11y warnings -->
        <button aria-label="backdrop" class="backdrop" onclick={closeModal}></button>
    {/snippet}
</Modals>

<SvelteToast />

<!-- TODO: this error display is just a try while reworking authentication  -->
<!-- 1. The errors thrown by initializeAuth0() might not really happen or not be relevant -->
<!-- 2. It might be better to use svelte built-in page error mecanism that I'm not familiar with already -->
<!-- Update 5 months later: I have never seen this notice displayed in real life yet. And I think the AuthNavItem
  -- doesn't have anymore issues where it's not updated when I'm logged out. So I might remove that in the future.
  -->
<!-- Update 2 more months later: I actually got the error (invalid state) displayed when implementing the redirect
  -- after login. So it's still useful to have that here.
  -->
{#if auth0Error}
    <Notice
        item={{
            level: 'error',
            header: 'Something went wrong with auth0 setup',
            message: auth0Error.message
        }}
    />
{/if}

<slot />

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
