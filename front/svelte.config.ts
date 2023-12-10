import adapter from 'svelte-adapter-github';
import { vitePreprocess } from '@sveltejs/kit/vite';
import { Config } from '@sveltejs/kit';

const REPO_NAME = '/workshop';
const prod = process.env.ENV === 'prod';
const base = prod ? REPO_NAME : '';

const config: Config = {
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: vitePreprocess(),

    kit: {
        adapter: adapter({
            pages: 'docs',
            assets: 'docs',
            fallback: undefined,
            precompress: false,
            domain: '',
            jekyll: false
        }),
        alias: {
            $config: 'src/config'
        },
        paths: {
            base
        }
    }
};

export default config;
