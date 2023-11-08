<script lang="ts">
    import { base } from '$app/paths';
    import { onMount } from 'svelte';
    import SvelteMarkdown from 'svelte-markdown';
    import ImageRenderer from './renderers/Image.svelte';
    import LinkRenderer from './renderers/Link.svelte';

    export let source: string;
    let sourceWithFixedLinks: string;

    onMount(() => {
        // Shitty hack because I didn't figure out how to tweak the pre-renderer
        // to properly include the baseUrl in the image links
        sourceWithFixedLinks = source.replaceAll('{baseUrl}', base);
    });
</script>

<SvelteMarkdown
    source={sourceWithFixedLinks}
    renderers={{ image: ImageRenderer, link: LinkRenderer }}
/>
