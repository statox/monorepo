<script lang="ts">
    import { onMount } from 'svelte';
    import { startGoogleOAuthFlow, logoutGoogle } from '$lib/YtHelper/googleAuth';
    import { fetchSubscriptions } from '$lib/YtHelper/api';
    import { authStore } from '$lib/YtHelper/store';
    import { client2 } from '$lib/api';

    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') === 'auth_failed') {
            history.replaceState(null, '', window.location.pathname);
            authStore.update((s) => ({
                ...s,
                status: 'unauthenticated',
                error: 'Google authentication failed — please try again.'
            }));
            return;
        }

        authStore.update((s) => ({ ...s, status: 'loading' }));
        try {
            const { authenticated } = await client2.youtube.authStatus();
            if (!authenticated) {
                authStore.update((s) => ({ ...s, status: 'unauthenticated' }));
                return;
            }
            const subscriptions = await fetchSubscriptions();
            authStore.set({ status: 'authenticated', subscriptions, error: null });
        } catch (e) {
            authStore.set({
                status: 'unauthenticated',
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
        <button onclick={startGoogleOAuthFlow}>Connect to YouTube</button>
    {:else if $authStore.status === 'loading'}
        <p>Loading...</p>
    {:else if $authStore.status === 'authenticated'}
        <button onclick={logoutGoogle}>Disconnect</button>
        <h2>Subscriptions ({$authStore.subscriptions.length})</h2>
        <ul>
            {#each $authStore.subscriptions as sub (sub.id)}
                <li>
                    {#if sub.thumbnailUrl}
                        <img src={sub.thumbnailUrl} alt={sub.title} width="36" height="36" />
                    {/if}
                    {sub.title}
                </li>
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

    li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    img {
        border-radius: 50%;
    }
</style>
