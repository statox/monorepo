<script lang="ts">
    import { getAccessToken, login, logout, user } from '$lib/auth/service';
    import { onMount } from 'svelte';

    // TODO Check that really works
    // Putting that here to make sure the app see the user when refreshing in dev
    // or when reopening the client after some time
    onMount(() => getAccessToken());
</script>

{#key $user}
    {#if $user}
        <button title="Log out" on:click={() => logout()}>
            <img class="user-profile" alt="user profile" src={$user.picture} />
        </button>
    {:else}
        <button title="Log in" type="button" on:click={() => login()}>
            <i class="fa fa-sign-in" aria-hidden="true"></i>
        </button>
    {/if}
{/key}

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
        display: inline;
        margin: 0;
        height: 1.5em;
        width: 1.5em;
    }
</style>
