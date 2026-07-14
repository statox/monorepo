import eslintJS from '@eslint/js';
import eslintPrettier from 'eslint-config-prettier';
import eslintSvelte from 'eslint-plugin-svelte';
import eslintTS from 'typescript-eslint';
import globals from 'globals';
import svelteConfig from './svelte.config.js';
import svelteParser from 'svelte-eslint-parser';
import { defineConfig } from 'eslint/config';

export default defineConfig(
    { ignores: ['**/*.d.ts', 'node_modules/**'] },
    eslintJS.configs.recommended,
    ...eslintTS.configs.recommended,
    ...eslintSvelte.configs.recommended,
    ...eslintSvelte.configs.prettier,
    eslintPrettier,
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: eslintTS.parser,
                svelteConfig
            },
            globals: {
                ...globals.browser
            }
        }
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: eslintTS.parser,
            globals: {
                ...globals.node
            }
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { caughtErrorsIgnorePattern: '^_' }]
        }
    }
);
