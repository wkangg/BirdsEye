// @ts-check
/* eslint-disable n/no-unpublished-import */
import globals from 'globals';

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import nodePlugin from 'eslint-plugin-n';
import stylistic from '@stylistic/eslint-plugin';

export default [
    eslint.configs.recommended,
    nodePlugin.configs['flat/recommended'],
    eslintPluginUnicorn.configs['flat/recommended'],
    stylistic.configs['recommended-flat'],
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            '@stylistic': stylistic
        },
        languageOptions: {
            ecmaVersion: 'latest',
            parser: tseslint.parser,
            globals: {
                ...globals.browser,
                ...globals['shared-node-browser'],
                QCompress: 'writable',
                QrScanner: 'writable',
                QRCode: 'writable',
                Toastify: 'writable',
                APP_VERSION: 'writable',
                VERSION_RELEASE_DATE: 'writable'
            }
        },
        rules: {
            'unicorn/prefer-string-replace-all': 'error',
            'unicorn/prevent-abbreviations': 'off',
            'unicorn/prefer-module': 'off',
            'unicorn/no-static-only-class': 'off',
            'unicorn/switch-case-braces': ['error', 'avoid'],
            'unicorn/no-null': 'off',
            'unicorn/filename-case': 'off',
            'unicorn/no-nested-ternary': 'off',
            'unicorn/no-array-for-each': 'off',
            'unicorn/numeric-separators-style': 'off',
            'unicorn/prefer-top-level-await': 'off',
            'unicorn/no-abusive-eslint-disable': 'off',
            'unicorn/prefer-number-properties': 'off',
            'unicorn/prefer-code-point': 'off',
            'n/prefer-global/buffer': ['error', 'always'],
            'n/prefer-global/console': ['error', 'always'],
            'n/prefer-global/process': ['error', 'always'],
            'n/prefer-global/url-search-params': ['error', 'always'],
            'n/prefer-global/url': ['error', 'always'],
            'n/prefer-promises/dns': 'error',
            'n/no-deprecated-api': 'error',
            'no-lonely-if': 'error',
            '@stylistic/no-extra-parens': ['error', 'all'],
            '@stylistic/no-extra-semi': 'warn',
            '@stylistic/no-trailing-spaces': 'warn',
            '@stylistic/no-multiple-empty-lines': 'warn',
            'prefer-object-has-own': 'error',
            'dot-notation': 'warn',
            'no-unreachable': 'error',
            'no-constant-condition': 'off',
            'yoda': ['error', 'never', { exceptRange: true }],
            '@stylistic/arrow-parens': ['error', 'as-needed'],
            '@stylistic/brace-style': ['error', '1tbs'],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/eol-last': ['warn', 'never'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/space-infix-ops': 'off',
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],
            '@stylistic/space-before-function-paren': [
                'error',
                {
                    anonymous: 'never',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ],
            'prefer-const': [
                'error',
                {
                    destructuring: 'all',
                    ignoreReadBeforeAssign: false
                }
            ]
        }
    }];