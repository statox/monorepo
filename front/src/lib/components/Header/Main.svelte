<script lang="ts">
    import HomeNavItem from '$lib/components/NavItems/HomeNavItem.svelte';
    import AuthNavItem from '$lib/components/NavItems/AuthNavItem.svelte';
    import { pageNameStore } from './store';
</script>

<header>
    <h1>
        <span>{$pageNameStore}</span>
        <nav>
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
</style>
