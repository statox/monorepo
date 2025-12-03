<script lang="ts">
    import { onMount } from 'svelte';
    import hljs from 'highlight.js';
    import SvelteMarkdown from '@humanspeak/svelte-markdown';
    import ImageRenderer from './renderers/Image.svelte';
    import LinkRenderer from './renderers/Link.svelte';

    export let source: string;

    const renderers = { image: ImageRenderer, link: LinkRenderer };
    onMount(() => {
        hljs.highlightAll();
    });
</script>

<SvelteMarkdown {source} {renderers} />
