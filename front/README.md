# apps.statox.fr

## TODO

### Fixes

- [ ] Make `<kbd>` tags work in Markdown component
- [x] Fix css duplicated by Markdown in `<svelte:head>`
- [ ] Find a way to use `hljs.highlightElement` in Markdown to avoid calling `highlight` on already highlighted code. Maybe replace `hljs` by `prism` as I do on www.statox.fr because the highlighting is slightly better
- [ ] Fix `audioContext` on iOS Safari in Metronome page
- [x] Find a better way to store authentication token. For now they are insecure in the local storage
    - Auth is now stored in the cookie `connect.sid` not accessible via javascript.

### Improvements

- [x] Svelte 5:
    - [x] Most components are migrated some were not migrated because of:
        - [x] [svelte-markdown](https://github.com/pablo-abc/svelte-markdown). Now replaced with [humanspeak/svelte-markdown](https://github.com/humanspeak/svelte-markdown).
        - [x] [svelte-jsoneditor](https://github.com/josdejong/svelte-jsoneditor). The repo was updated and issues are solved.
    - [x] A couple of components still use `run` from `svelte/legacy` instead of `$effect` because the migration break them and I have to look into it.
    - [x] Replace `createEventDispatcher` by callback props
- [x] Add checks to allow Dependabot MRs to be merged automatically
- [x] Add link to the last GitHub Pages deployment
- [x] Rework `fetch` calls into a framework for unified access to api.statox.fr
- [x] Rework CSS. Default should be dark theme. Add a button to switch themes
    - [x] Extend colors to get warning red, info blue, success green, ...
- [ ] Recreate mechanism to open note in its own page
- [x] Rework home page to be more descriptive and useful
- [x] Get toast library from https://github.com/zerodevx/svelte-toast/blob/master/src/lib/ToastItem.svelte
- [x] Clean up the `getAccessToken()` function so that it doesn't return `string | undefined` and handle errors properly.

## Environment variable

For now environment variables are all public (only the backend url so far) and can have different values depending on the environment:

- Write values for local dev in `env.local`
- Write values for prod in `env.prod`

A script in `svelte.config.js` copies the file corresponding to the environment in `.env`.

The variables can then be read from components with:

```
import { PUBLIC_ENVIRONMENT } from '$env/static/public';
```

When adding a new value run `npx svelte-kit sync` to avoid errors like

```error
Module '"$env/static/public"' has no exported member VARIABLE_NAME
```

## Resource

Notes about CSS and Markdown
https://joshcollinsworth.com/blog/build-static-sveltekit-markdown-blog
