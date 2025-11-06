<script lang="ts">
    import HomeNavItem from '$lib/components/NavItems/HomeNavItem.svelte';
    import UserProfileNavItem from '$lib/components/NavItems/UserProfileNavItem.svelte';
    import Auth2NavItem from '$lib/components/NavItems/Auth2NavItem.svelte';
    import ThemeSwitcherNavItem from '$lib/components/NavItems/ThemeSwitcherNavItem.svelte';
    import { pageNameStore, showLoginSuccess } from './store';
    import { Notice } from '../Notice';
    import { user } from '$lib/auth2';
</script>

<header>
    <h1>
        <a href="/">{$pageNameStore}</a>
    </h1>
    <nav>
        <span><HomeNavItem /></span>
        <span class="last-left-menu-item"><Auth2NavItem /></span>
        <span><UserProfileNavItem /></span>
        <span><ThemeSwitcherNavItem /></span>
    </nav>
</header>

{#if $showLoginSuccess}
    <Notice
        item={{
            level: 'success',
            header: 'Login successful',
            message: 'You are logged in as ' + $user?.user.username
        }}
    />
{/if}

<style>
    header {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.5em;

        align-items: center;
    }

    nav {
        display: inline-flex;
        flex-direction: row;
        gap: 0.3em;

        flex-grow: 1;
    }

    .last-left-menu-item {
        flex-grow: 1;
    }

    a {
        color: var(--nc-tx-1);
    }
</style>
