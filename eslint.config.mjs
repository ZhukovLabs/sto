// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/storybook-static/**',
      '**/.pen/**',
      '**/.screens/**',
      'apps/api/src/generated/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['apps/web/src/**/*.{ts,tsx}'],
      'boundaries/elements': [
        { type: 'app-pages', pattern: 'apps/web/src/_pages/*' },
        { type: 'widgets', pattern: 'apps/web/src/widgets/*' },
        { type: 'features', pattern: 'apps/web/src/features/*' },
        { type: 'entities', pattern: 'apps/web/src/entities/*' },
        { type: 'shared', pattern: 'apps/web/src/shared/*' },
      ],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['apps/web/tsconfig.json'],
        },
      },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          message:
            '{{file.relative}} импортирует {{dependency.source}} — нарушены границы слоёв FSD (импорт только вниз: app-pages → widgets → features → entities → shared, без перекрёстных импортов внутри слоя и только через index.ts)',
          policies: [
            {
              from: { element: { type: 'app-pages' } },
              disallow: { to: [{ element: { type: 'app-pages' } }] },
            },
            {
              from: { element: { type: 'widgets' } },
              disallow: {
                to: [
                  { element: { type: 'app-pages' } },
                  { element: { type: 'widgets' } },
                ],
              },
            },
            {
              from: { element: { type: 'features' } },
              disallow: {
                to: [
                  { element: { type: 'app-pages' } },
                  { element: { type: 'widgets' } },
                  { element: { type: 'features' } },
                ],
              },
            },
            {
              from: { element: { type: 'entities' } },
              disallow: {
                to: [
                  { element: { type: 'app-pages' } },
                  { element: { type: 'widgets' } },
                  { element: { type: 'features' } },
                  { element: { type: 'entities' } },
                ],
              },
            },
            {
              from: { element: { type: 'shared' } },
              disallow: {
                to: [
                  { element: { type: 'app-pages' } },
                  { element: { type: 'widgets' } },
                  { element: { type: 'features' } },
                  { element: { type: 'entities' } },
                  { element: { type: 'shared' } },
                ],
              },
            },
            {
              disallow: {
                to: [
                  {
                    element: {
                      type: ['app-pages', 'widgets', 'features', 'entities'],
                      internalPath: '!index.ts',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  },
);
