<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { checkAuth, user } from '$lib/auth2';

    onMount(() => {
        checkAuth();
    });
</script>

{#if $user}
    <button title="My profile" class="user-profile" onclick={() => goto('/auth/me')}>
        {$user.user.username[0].toUpperCase()}
    </button>
{:else}
    <button title="Log in" onclick={() => goto('/auth/login')}>
        <i class="fa fa-sign-in" aria-hidden="true"></i>
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
    .fa {
        font-size: 1.5em;
    }

    .user-profile {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.8em;
        height: 1.8em;
        border-radius: 50%;
        background-color: var(--nc-bg-2);
        border: 2px solid var(--nc-tx-1);
        color: var(--nc-tx-2);
        font-weight: bold;
        font-size: 1em;
    }
</style>
