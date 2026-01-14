<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { toast } from './stores';
    import ToastItem from './ToastItem.svelte';
    import type { SvelteToastOptions } from './stores';

    interface Props {
        options?: Partial<SvelteToastOptions>;
        target?: string;
    }

    let { options = {}, target = 'default' }: Props = $props();

    let items: (Partial<SvelteToastOptions> & { id: number })[] = $derived(
        $toast.filter((i) => i.target === target)
    );

    function getCss(theme?: Record<string, string | number>) {
        return theme ? Object.keys(theme).reduce((a, c) => `${a}${c}:${theme[c]};`, '') : undefined;
    }

    $effect(() => {
        toast._init(target, options);
    });
</script>

<ul class="_toastContainer">
    {#each items as item (item.id)}
        <li
            class={item.classes?.join(' ')}
            in:fly={item.intro}
            out:fade
            animate:flip={{ duration: 200 }}
            style={getCss(item.theme)}
        >
            <ToastItem {item} />
        </li>
    {/each}
</ul>

<style>
    ._toastContainer {
        top: var(--toastContainerTop, 1.5rem);
        right: var(--toastContainerRight, 2rem);
        bottom: var(--toastContainerBottom, auto);
        left: var(--toastContainerLeft, auto);
        position: fixed;
        margin: 0;
        padding: 0;
        list-style-type: none;
        pointer-events: none;
        z-index: var(--toastContainerZIndex, 9999);
    }
</style>
