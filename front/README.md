# apps.statox.fr

## TODO

-   Make `<kbd>` tags work in Markdown component
-   Fix css duplicated by Markdown in `<svelte:head>`
-   Find a way to use `hljs.highlightElement` in Mardown to avoid calling `highlight` on already highlighted code
-   Recreate mechanism to open note in its own page

-   Get toast library from https://github.com/zerodevx/svelte-toast/blob/master/src/lib/ToastItem.svelte

## Environement variable

For now environement variables are all public (only the backend url so far) and can have different values depending on the environement:

-   Write values for local dev in `env.local`
-   Write values for prod in `env.prod`

A script in `svelte.config.js` copies the file corresponding to the environement in `.env`.

The variables can then be read from components with:

```
import { PUBLIC_API_URL } from '$env/static/public';
```

When adding a new value run `npx svelte-kit sync` to avoid errors like

```error
Module '"$env/static/public"' has no exported member VARIABLE_NAME
```

## Resource

Notes about CSS and markdown
https://joshcollinsworth.com/blog/build-static-sveltekit-markdown-blog
