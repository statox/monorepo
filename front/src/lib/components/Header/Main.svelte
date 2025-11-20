<script lang="ts">
    import UserProfileNavItem from '$lib/components/NavItems/UserProfileNavItem.svelte';
    import AuthNavItem from '$lib/components/NavItems/AuthNavItem.svelte';
    import ThemeSwitcherNavItem from '$lib/components/NavItems/ThemeSwitcherNavItem.svelte';
    import { pageNameStore, showLoginSuccess } from './store';
    import { Notice } from '../Notice';
    import { user } from '$lib/auth';
</script>

<header>
    <h1>
        <a class="home-link" href="/">
            <img alt="website logo" class="home-img" src="/favicon.png" />
            {$pageNameStore}
        </a>
    </h1>
    <nav>
        <span class="last-left-menu-item"><ThemeSwitcherNavItem /></span>
        <span><AuthNavItem /></span>
        <span><UserProfileNavItem /></span>
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
    .home-link:hover {
        .home-img {
            filter: brightness(70%) invert(10%);
        }
    }
    .home-link {
        display: flex;
        align-items: end;
        gap: 0.2em;
    }
    .home-img {
        height: 1em;
    }
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
