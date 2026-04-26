<script lang="ts">
    import { onMount } from 'svelte';
    import { startOAuthFlow, exchangeCodeForToken, clearAuth } from '$lib/YtHelper/auth';
    import { fetchSubscriptions } from '$lib/YtHelper/api';
    import { authStore } from '$lib/YtHelper/store';

    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (!code) return;

        // Clean the code from the URL immediately
        const cleanUrl = window.location.pathname;
        history.replaceState(null, '', cleanUrl);

        const verifier = sessionStorage.getItem('yt_pkce_verifier');
        if (!verifier) {
            authStore.update((s) => ({
                ...s,
                status: 'unauthenticated',
                error: 'OAuth flow interrupted — please try again.'
            }));
            return;
        }

        authStore.update((s) => ({ ...s, status: 'loading' }));
        try {
            const token = await exchangeCodeForToken(code);
            const subscriptions = await fetchSubscriptions(token);
            authStore.set({ status: 'authenticated', token, subscriptions, error: null });
        } catch (e) {
            authStore.set({
                status: 'unauthenticated',
                token: null,
                subscriptions: [],
                error: e instanceof Error ? e.message : 'An unknown error occurred'
            });
        }
    });
</script>

<main>
    <h1>YouTube Helper</h1>

    {#if $authStore.status === 'unauthenticated'}
        {#if $authStore.error}
            <p class="error">{$authStore.error}</p>
        {/if}
        <button onclick={startOAuthFlow}>Connect to YouTube</button>
    {:else if $authStore.status === 'loading'}
        <p>Loading...</p>
    {:else if $authStore.status === 'authenticated'}
        <button onclick={clearAuth}>Disconnect</button>
        <h2>Subscriptions ({$authStore.subscriptions.length})</h2>
        <ul>
            {#each $authStore.subscriptions as name}
                <li>{name}</li>
            {/each}
        </ul>
    {/if}
</main>

<style>
    main {
        max-width: 600px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    .error {
        color: var(--color-error, red);
    }
</style>
