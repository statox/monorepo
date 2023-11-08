<script lang="ts">
    import { base } from '$app/paths';
    import { onMount } from 'svelte';
    import hljs from 'highlight.js';
    import SvelteMarkdown from 'svelte-markdown';
    import ImageRenderer from './renderers/Image.svelte';
    import LinkRenderer from './renderers/Link.svelte';

    export let source: string;
    let sourceWithFixedLinks: string;

    onMount(() => {
        // Shitty hack because I didn't figure out how to tweak the pre-renderer
        // to properly include the baseUrl in the image links
        sourceWithFixedLinks = source.replaceAll('{baseUrl}', base);

        hljs.highlightAll();
    });
</script>

<svelte:head>
    <!-- TODO Find a way to avoid adding this line several time when we have multiple Markdown components -->
    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.3.2/build/styles/night-owl.min.css"
    />
</svelte:head>

<SvelteMarkdown
    source={sourceWithFixedLinks}
    renderers={{ image: ImageRenderer, link: LinkRenderer }}
/>
