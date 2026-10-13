import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';

export default defineConfig(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/generated/**',
      'artifacts/**',
      '.superpowers/**',
    ],
  },
  {
    files: ['**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: [
      'vitest.config.ts',
      'playwright.config.ts',
      'tests/e2e/**/*.ts',
      'packages/contracts/**/*.ts',
      'packages/domain/**/*.ts',
      'apps/api/**/*.ts',
    ],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: [
      'vitest.config.ts',
      'packages/contracts/vitest.config.ts',
      'packages/contracts/tools/**/*.ts',
      'packages/contracts/src/**/*.test.ts',
      'packages/contracts/src/{schemas,compiler,server}.ts',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['packages/contracts/src/{browser,semantic,canonical,catalog,validation}.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', 'ajv', 'ajv/*', 'ajv-formats', 'typebox', 'typebox/*'],
              message: 'Módulo compartilhado deve ser puro e compatível com o navegador.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/domain/src/**/*.ts'],
    ignores: ['packages/domain/src/**/*.test.ts', 'packages/domain/src/fixtures.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'node:*',
                '@pecuaria/contracts/server',
                '@pecuaria/contracts/browser',
                'react',
                'react/*',
              ],
              message: 'Domínio deve consumir somente tipos dos contratos e aritmética decimal.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    plugins: { 'react-hooks': hooks, 'react-refresh': refresh },
    rules: {
      ...hooks.configs.recommended.rules,
      ...refresh.configs.vite.rules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'node:*',
                '@pecuaria/contracts/server',
                '@pecuaria/api',
                '@pecuaria/api/*',
                'ajv',
                'ajv/*',
                'typebox',
                'typebox/*',
                '**/apps/api/**',
              ],
              message: 'A interface deve consumir contratos puros do navegador e domínio.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/*.config.ts', 'apps/web/tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
