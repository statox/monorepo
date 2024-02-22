# apps.statox.fr

## TODO

### Fixes

-   [ ] Make `<kbd>` tags work in Markdown component
-   [x] Fix css duplicated by Markdown in `<svelte:head>`
-   [ ] Find a way to use `hljs.highlightElement` in Mardown to avoid calling `highlight` on already highlighted code. Maybe replace `hljs` by `prism` as I do on www.statox.fr because the highlighting is slightly better
-   [ ] Fix `audioContext` on iOS Safari in Metronome page
-   [ ] Find a better way to store authentication token. For now they are insecure in the local storage

### Improvements

-   [ ] Add checks to allow dependabots MRs to be merged automatically
-   [x] Add link to the last GitHub Pages deployment
-   [x] Rework `fetch` calls into a framework for unified access to api.statox.fr
-   [ ] Rework CSS. Default should be dark theme. Add a button to switch themes
    - [ ] Extend colors to get warning red, info blue, success green, ...
-   [ ] Recreate mechanism to open note in its own page
-   [x] Rework home page to be more descriptive and useful
-   [x] Get toast library from https://github.com/zerodevx/svelte-toast/blob/master/src/lib/ToastItem.svelte
-   [ ] Clean up the `getAccessToken()` function so that it doesn't return `string | undefined` and handle errors properly.

### Features

-   [ ] Create Tuner app in the music section
-   [ ] See how to integrate [statox setup](https://github.com/statox/setup) maybe with some notes or guidance
-   [ ] Integrate [my color picker](https://statox.github.io/color-picker/)?
-   [ ] Imagine a CMS-like system to add data to a todo list

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
