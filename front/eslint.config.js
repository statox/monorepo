import eslintJS from '@eslint/js';
import eslintPrettier from 'eslint-config-prettier';
import eslintSvelte from 'eslint-plugin-svelte';
import eslintTS from 'typescript-eslint';
import globals from 'globals';
import pluginImport from 'eslint-plugin-import';
import svelteConfig from './svelte.config.js';
import svelteParser from 'svelte-eslint-parser';
import { defineConfig } from 'eslint/config';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';

const commonRules = {
    // TODO Fix code to re-enable this rule
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow try...catch blocks to not use the caught error
    '@typescript-eslint/no-unused-vars': [
        'error',
        {
            caughtErrors: 'none'
        }
    ]
};

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
    includeIgnoreFile(gitignorePath),
    { ignores: ['**/*.d.ts'] },
    eslintJS.configs.recommended,
    ...eslintTS.configs.recommended,
    ...eslintSvelte.configs.recommended,
    ...eslintSvelte.configs.prettier,
    eslintPrettier,
    {
        files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: eslintTS.parser,
                svelteConfig
            },
            globals: {
                ...globals.browser
            }
        },
        rules: {
            ...commonRules,
            // See https://github.com/sveltejs/eslint-plugin-svelte/issues/1353
            // and https://github.com/statox/apps.statox.fr/pull/415
            // I can't get this rule to work and all the existing resolve and links
            // work well so for now I'm disabling it
            'svelte/no-navigation-without-resolve': [
                'off',
                {
                    ignoreGoto: true,
                    ignoreLinks: true,
                    ignorePushState: true,
                    ignoreReplaceState: true
                }
            ],
            'svelte/require-each-key': 'off' // TODO Check if it's worth fixing and re-enabling
        }
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: eslintTS.parser
        },
        rules: {
            ...commonRules
        }
    },
    {
        files: ['**/*server.ts'],
        languageOptions: {
            parser: eslintTS.parser,
            globals: {
                ...globals.node
            }
        },
        rules: {
            ...commonRules
        }
    },
    {
        plugins: {
            '@typescript-eslint': eslintTS.plugin,
            import: pluginImport
        },
        rules: {
            // 'svelte/sort-attributes': 'warn' // Check if it's worth enabling
        }
    }
);
