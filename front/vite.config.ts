import fs from 'node:fs';
import type { UserConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import plainText from 'vite-plugin-plain-text';

const prod = process.env.ENV === 'prod';

const config: UserConfig = {
    plugins: [
        plainText(['**/*.md'], {
            namedExport: false,
            dtsAutoGen: true,
            distAutoClean: false
        }),
        sveltekit()
    ],
    server: prod
        ? {}
        : {
              // Setup a self signed certificate when served locally to allow
              // the API to return a session cookie with the secure option
              https: {
                  key: fs.readFileSync('./localhost.key'),
                  cert: fs.readFileSync('./localhost.crt')
              },
              host: 'localhost',
              port: 8080
          }
};

export default config;
