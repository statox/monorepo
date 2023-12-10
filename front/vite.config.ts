import type { UserConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import plainText from 'vite-plugin-plain-text';

const config: UserConfig = {
    plugins: [
        plainText(['**/*.md'], {
            namedExport: false,
            dtsAutoGen: true,
            distAutoClean: false
        }),
        sveltekit()
    ]
};

export default config;
