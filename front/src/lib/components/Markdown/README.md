# Markdown

This markdown component is based on [svelte-markdown](https://github.com/pablo-abc/svelte-markdown) as of January 2025 it seems the project is not maintained anymore.

I couldn't properly migrate this component to svelte 5 so for now I'll keep it as it.

The problem is about this piece of code:

```
<SvelteMarkdown
    source={sourceWithFixedLinks}
    renderers={{ image: ImageRenderer, link: LinkRenderer }}
/>
```

We get an error because the new component system makes the components functions instead of classes and using `ImageRenderer` and `LinkRenderer` in `renderers` creates a typing issue in svelte-check.

The [migration guide](https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes) recommends to use `createClassComponent` or `asClassComponent` to circumvent the issue but I couldn't get that to work.
