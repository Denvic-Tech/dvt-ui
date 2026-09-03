import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  { ignores: ['dist', 'trash', 'tmp'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React stuff
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // TS relax
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-pattern': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-this-alias': 'warn',

      'no-undef': 'off',

      // import rules (валидация)
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/extensions': [
        'warn',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
          js: 'never',
          jsx: 'never',
        },
      ],

      // отключаем конфликтующие
      'sort-imports': 'off',

      // 👇 основная магия — сортировка
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // node
            ['^node:'],

            // внешние либы
            ['^react$', '^@?\\w'],

            // FSD слои
            ['^@/app'],
            ['^@/processes'],
            ['^@/pages'],
            ['^@/widgets'],
            ['^@/features'],
            ['^@/entities'],
            ['^@/shared'],

            // прочие alias
            ['^@/'],

            // relative
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],

            // стили
            ['^.+\\.s?css$'],
          ],
        },
      ],

      'simple-import-sort/exports': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  {
    files: ['src/node-extensions/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/node-extensions/common', '@/node-extensions/common/**'],
              message:
                'Do not share reusable code through src/node-extensions/common. Move it into shared/entities/features or node extension infrastructure.',
            },
            {
              group: [
                '../shared',
                '../shared/**',
                '../../shared',
                '../../shared/**',
                '../../../shared',
                '../../../shared/**',
                '../../../../shared',
                '../../../../shared/**',
              ],
              message:
                'Do not share reusable code through extension-local shared folders. Move it into shared/entities/features instead.',
            },
          ],
        },
      ],
    },
  }
);
