<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { checkAuth, user, usernameToColor } from '$lib/auth';

    onMount(() => {
        checkAuth();
    });

    let userColors = $derived(usernameToColor($user?.user.username));
</script>

{#if $user}
    <button
        title={$user.user.username}
        class="user-profile"
        onclick={() => goto('/auth/me')}
        style="--user-color: {userColors.main}; --user-compl-color: {userColors.complementary}"
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
        border: 2px solid var(--user-compl-color);
        color: var(--user-compl-color);
        font-weight: bold;
        font-size: 1em;
    }
</style>
