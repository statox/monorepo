<script lang="ts">
    import HomeNavItem from '$lib/components/NavItems/HomeNavItem.svelte';
    import AuthNavItem from '$lib/components/NavItems/AuthNavItem.svelte';
    import Auth2NavItem from '$lib/components/NavItems/Auth2NavItem.svelte';
    import ThemeSwitcherNavItem from '$lib/components/NavItems/ThemeSwitcherNavItem.svelte';
    import { pageNameStore } from './store';
</script>

<header>
    <h1>
        <a href="/">{$pageNameStore}</a>
    </h1>
    <nav>
        <span><HomeNavItem /></span>
        <span><Auth2NavItem /></span>
        <span class="before-last-item"><AuthNavItem /></span>
        <span><ThemeSwitcherNavItem /></span>
    </nav>
</header>

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

    .before-last-item {
        flex-grow: 1;
    }

    a {
        color: var(--nc-tx-1);
    }
</style>
