import * as fs from 'fs';
import adapter from 'svelte-adapter-github';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// CHANGEME
const REPO_NAME = '/workshop';
const prod = process.env.ENV === 'prod';
const base = prod ? REPO_NAME : '';

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
