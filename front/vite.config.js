import { sveltekit } from '@sveltejs/kit/vite';
import plainText from 'vite-plugin-plain-text';

/** @type {import('vite').UserConfig} */
const config = {
    plugins: [
        plainText(['**/*.md'], {
            namedExport: false,
            dtsAutoGen: true,
            distAutoClean: false
        }),
        sveltekit()
    ],
    test: {}
};

export default config;
