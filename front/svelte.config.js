import adapter from 'svelte-adapter-github';
import { vitePreprocess } from '@sveltejs/kit/vite';

// CHANGEME
const REPO_NAME = '/p5-svelte-template';
const prod = process.env.ENV === 'prod';
/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: vitePreprocess(),

    kit: {
        adapter: adapter({
            pages: 'docs',
            assets: 'docs',
            fallback: null,
            precompress: false,
            domain: '',
            jekyll: false,
            paths: {
                base: prod ? REPO_NAME : ''
            }
        })
    }
};

export default config;
