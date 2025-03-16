import eslint from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import svelteEslint from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import tsEslint from 'typescript-eslint';

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

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    {
        ignores: ['**/*.d.ts']
    },
    eslint.configs.recommended,
    ...tsEslint.configs.recommended,
    ...svelteEslint.configs['flat/recommended'],
    ...svelteEslint.configs['flat/prettier'],
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tsEslint.parser
            },
            globals: {
                ...globals.browser
            }
        },
        rules: {
            ...commonRules,
            'svelte/require-each-key': 'off' // TODO Check if it's worth fixing and re-enabling
        }
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsEslint.parser
        },
        rules: {
            ...commonRules
        }
    },
    {
        files: ['**/*server.ts'],
        languageOptions: {
            parser: tsEslint.parser,
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
            '@typescript-eslint': tsEslint.plugin,
            import: pluginImport
        },
        rules: {
            // 'svelte/sort-attributes': 'warn' // Check if it's worth enabling
        }
    }
];
