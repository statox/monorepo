import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import parser from 'svelte-eslint-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    ...compat.extends(
        'eslint:recommended',
        'plugin:svelte/recommended',
        'plugin:svelte/prettier',
        'plugin:@typescript-eslint/recommended',
        'prettier'
    ),
    {
        files: ['src/**/*.ts'],
        plugins: {
            '@typescript-eslint': typescriptEslint
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },

            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: 'module',

            parserOptions: {
                project: './tsconfig.json',
                extraFileExtensions: ['.svelte']
            }
        },

        rules: {
            // TODO Fix code to re-enable this rule
            '@typescript-eslint/no-explicit-any': 'off',
            // Allow try...catch blocks to not use the caught error
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    caughtErrors: 'none'
                }
            ]
        }
    },
    {
        // Parse the `<script>` in `.svelte` as TypeScript
        files: ['src/**/*.svelte'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },

            parser: parser,
            ecmaVersion: 5,
            sourceType: 'script',

            parserOptions: {
                parser: '@typescript-eslint/parser'
            }
        },
        rules: {
            // TODO Fix code to re-enable this rule
            '@typescript-eslint/no-explicit-any': 'off',
            // Allow try...catch blocks to not use the caught error
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    caughtErrors: 'none'
                }
            ]
        }
    }
];
