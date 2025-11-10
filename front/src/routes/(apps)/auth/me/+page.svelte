<script lang="ts">
    import { onMount } from 'svelte';
    import { checkAuth, logout, updateProfile, user } from '$lib/auth2';

    onMount(() => {
        checkAuth();
    });
</script>

{#if $user}
    <h2>Hello {$user.user.username}</h2>
    <p>Your id: {$user.user.id}</p>
    <p>Your permissions</p>
    <ul>
        {#each $user.user.scopes as scope}
            <li>{scope}</li>
        {/each}
    </ul>

    <button onclick={updateProfile}>Refresh my profile</button>
    <button onclick={logout}>Log out</button>
{:else}
    <h2>Hey stranger</h2>
    <p>You are not logged in. Go to the <a href="/auth/login">login page</a></p>
{/if}
