<script lang="ts">
    import HomeNavItem from '$lib/components/NavItems/HomeNavItem.svelte';
    import AuthNavItem from '$lib/components/NavItems/AuthNavItem.svelte';
    import { pageNameStore } from './store';
</script>

<header>
    <h1>
        <nav>
            <a href="/">{$pageNameStore}</a>
            <HomeNavItem />
            <AuthNavItem />
        </nav>
    </h1>
</header>

<style>
    nav {
        display: inline-flex;
        flex-direction: row;
        gap: 0.3em;
    }

    a {
        color: var(--nc-tx-1);
    }
</style>
