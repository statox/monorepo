<script lang="ts">
    import { type Snippet } from 'svelte';
    import ThemeSwitcher from './ThemeSwitcher.svelte';

    interface Props {
        children?: Snippet;
    }
    let { children }: Props = $props();
</script>

<header>
    <h1>
        <a href="/">SimpleVector Demo</a>
    </h1>
    <nav>
        <span><ThemeSwitcher /></span>
    </nav>
</header>
{@render children?.()}
