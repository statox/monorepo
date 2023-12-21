<script lang="ts">
    import { login, logout, user } from '$lib/auth/service';
</script>

<span>
    {#if $user}
        <button on:click={() => logout()}>
            <img class="user-profile" alt="user profile" src={$user.picture} />
        </button>
    {:else}
        <button type="button" on:click={() => login()}>Login</button>
    {/if}
</span>

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

    .user-profile {
        display: inline;
        margin: 0;
        height: 1.5em;
        width: 1.5em;
    }
</style>

