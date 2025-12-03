<script lang="ts">
    import { onMount } from 'svelte';
    import hljs from 'highlight.js';
    import SvelteMarkdown from '@humanspeak/svelte-markdown';
    import ImageRenderer from './renderers/Image.svelte';
    import LinkRenderer from './renderers/Link.svelte';

    interface Props {
        source: string;
    }

    let { source }: Props = $props();

    const renderers = { image: ImageRenderer, link: LinkRenderer };
    onMount(() => {
        hljs.highlightAll();
    });
</script>

<SvelteMarkdown {source} {renderers} />
