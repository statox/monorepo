# Markdown

This markdown component is based on [svelte-markdown](https://github.com/humanspeak/svelte-markdown), a fork of the original [svelte-markdown](https://github.com/pablo-abc/svelte-markdown) which as of January 2025 seems to not be maintained anymore.

The original project created issue with Svelte 5 migration and forced me to add an `override` in `package.json` to keep `svelte 5.17.5` specifically for this component. Using the fork seems to solve all issues.

We use two custom renderers:

- [`LinkRenderer`](./renderers/Link.svelte) To make the links open in a new tab
- [`ImageRenderer`](./renderers/Image.svelte) To make the images a fixed width. (We could probably either get rid of this one and tweak the style directly in markdown or make this renderer smarter/more configurable). It also uses `loading="lazy"` which the default renderer does, I haven't checked extensively how that works.

---

**Original notes from January 2025**
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
