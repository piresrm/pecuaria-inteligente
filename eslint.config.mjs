import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
  prettier,
);
