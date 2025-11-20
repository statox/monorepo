<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { checkAuth, user, usernameToColor } from '$lib/auth';

    onMount(() => {
        checkAuth();
    });
</script>

{#if $user}
    <button
        title="My profile"
        class="user-profile"
        onclick={() => goto('/auth/me')}
        style="--user-color: {usernameToColor($user?.user.username)}"
    >
        {$user.user.username[0].toUpperCase()}
    </button>
{:else}
    <button title="Log in" onclick={() => goto('/auth/login')}>
        <i class="fas fa-user" aria-hidden="true"></i>
    </button>
{/if}

<style>
    button {
        background: none;
        color: var(--nc-lk-1);
        padding: 0;
    }
    button:hover {
        background: none;
        color: var(--nc-lk-2);
    }
    .fas {
        font-size: 1.5em;
    }

    .user-profile {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.8em;
        height: 1.8em;
        border-radius: 50%;
        background-color: var(--user-color);
        border: 2px solid var(--nc-tx-3);
        color: var(--nc-tx-2);
        font-weight: bold;
        font-size: 1em;
    }
</style>
