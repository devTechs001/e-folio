import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Root ESLint flat config.
 *
 * The only config in the repo previously lived in documentation/, so
 * `npm run lint` always failed with "couldn't find eslint.config.js" and CI
 * silently swallowed it with `|| echo`. Stylistic legacy issues are warnings;
 * real correctness problems (undefined globals, duplicate members) stay errors.
 */
export default [
    {
        ignores: [
            'dist/**', 'node_modules/**', 'public/**', 'documentation/**',
            'server/server_backup.js', 'api/**', 'services/**', 'templates/**',
            'hooks/**', 'playground-e-folio.mongodb.js', 'test-*.html'
        ]
    },
    {
        files: ['src/**/*.{js,jsx}', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser, ...globals.node },
            parserOptions: { ecmaFeatures: { jsx: true } }
        },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            ...js.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
            'react-hooks/exhaustive-deps': 'warn',
            'no-empty': 'warn',
            'no-useless-escape': 'warn',
            'no-unreachable': 'warn',
            'no-case-declarations': 'warn'
        }
    },
    {
        files: ['server/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: { ...globals.node }
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
            'no-empty': 'warn',
            'no-useless-escape': 'warn',
            'no-unreachable': 'warn',
            'no-case-declarations': 'warn'
        }
    },
    {
        files: ['server/tests/integration/**/*.js', 'server/tests/services/**/*.js', 'server/tests/utils/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: { ...globals.node, ...globals.jest }
        }
    },
    {
        // k6 load scripts are ES modules executed by k6, not Node CommonJS.
        files: ['server/tests/load/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser, __ENV: 'readonly', console: 'readonly' },
            parserOptions: { allowImportExportEverywhere: true }
        },
        rules: {
            'no-undef': 'off',
            'no-unused-vars': 'warn'
        }
    },
    {
        files: ['scripts/**/*.js'],
        languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
        rules: { ...js.configs.recommended.rules }
    }
];
