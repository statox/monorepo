import * as fs from 'fs';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const prod = process.env.ENV === 'prod';

// Repo accessed with apps.statox.fr/ so base remain empty even on prod
const base = '';

// Copy env file depending on the environment
if (prod) {
    fs.copyFileSync('./env.prod', '.env');
} else {
    fs.copyFileSync('./env.local', '.env');
}

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
            fallback: '404.html',
            domain: '',
            jekyll: false
        }),
        alias: {
            $config: 'src/config'
        },
        paths: {
            relative: false,
            base
        }
    }
};

export default config;
