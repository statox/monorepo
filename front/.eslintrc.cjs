// See https://github.com/sveltejs/eslint-plugin-svelte?tab=readme-ov-file#parser-configuration

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:svelte/recommended',
        'plugin:svelte/prettier',
        'plugin:@typescript-eslint/recommended',
        'prettier'
    ],
    plugins: ['@typescript-eslint'],
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
        project: './tsconfig.json',
        extraFileExtensions: ['.svelte'] // This is a required setting in `@typescript-eslint/parser` v4.24.0.
    },
    overrides: [
        // Override the parser for svelte files
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            // Parse the `<script>` in `.svelte` as TypeScript by adding the following configuration.
            parserOptions: {
                parser: '@typescript-eslint/parser'
            }
        }
    ],
    env: {
        browser: true,
        es2017: true,
        node: true
    },
    rules: {
        // TODO Fix code to re-enable this rule
        '@typescript-eslint/no-explicit-any': 'off',
        // Allow try...catch blocks to not use the caught error
        '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }]
    }
};
