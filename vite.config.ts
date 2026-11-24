import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, lazyPlugins } from 'vite-plus'

// Components may only use theme color tokens (see no-restricted-classes below). Banned: Tailwind
// palette colors, literal colors inside arbitrary values, and bare color names. Allowed: tokens
// (`bg-danger/10`, `bg-(--color-x)`, `[x:var(--color-x)]`), transparent/current/inherit and the
// forced-colors system colors (`[ButtonText]`).
const colorUtility =
  '(?:bg|text|border(?:-[xysetrblie])?|ring|ring-offset|outline|fill|stroke|shadow|inset-shadow|inset-ring|drop-shadow|from|via|to|decoration|accent|caret|divide|placeholder)'
const systemColors =
  'transparent|current|currentColor|inherit|Canvas|CanvasText|LinkText|VisitedText|ActiveText|ButtonFace|ButtonText|ButtonBorder|Field|FieldText|Highlight|HighlightText|SelectedItem|SelectedItemText|Mark|MarkText|GrayText|AccentColor|AccentColorText'
const hardCodedColors = [
  {
    pattern: `(?:^|:)!?${colorUtility}-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3})(?:/.+)?$`,
    message: 'Use a theme color token (bg-surface, text-fg, ...), not the Tailwind palette: "$0".',
  },
  {
    pattern:
      '\\[[^\\]]*(?:#[0-9a-fA-F]{3,8}\\b|(?<![a-zA-Z-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(|(?<![a-zA-Z])(?:white|black)(?![a-zA-Z]))',
    message: 'Arbitrary values may reference tokens (var(--color-*)) but not literal colors: "$0".',
  },
  {
    pattern: `(?:^|:)!?${colorUtility}-\\[(?:color:)?(?!(?:${systemColors})\\])[a-zA-Z]+\\]`,
    message: 'Use a theme color token, transparent, current or a forced-colors system color: "$0".',
  },
]

export default defineConfig({
  fmt: {
    printWidth: 100,
    singleQuote: true,
    semi: false,
    sortImports: { newlinesBetween: false },
    ignorePatterns: ['dist', 'storybook-static', 'docs/.next', 'docs/out', 'docs/.source'],
    overrides: [{ files: ['*.css'], options: { singleQuote: false } }],
  },
  lint: {
    plugins: ['typescript', 'unicorn', 'oxc', 'react', 'jsx-a11y'],
    jsPlugins: [
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
      'eslint-plugin-better-tailwindcss',
    ],
    settings: { 'better-tailwindcss': { entryPoint: 'src/styles/dev.css', rootFontSize: 16 } },
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      'react/rules-of-hooks': 'error',
      'better-tailwindcss/enforce-canonical-classes': 'error',
      'better-tailwindcss/no-unnecessary-whitespace': 'error',
    },
    overrides: [
      {
        files: ['src/components/**/*.{ts,tsx}'],
        rules: {
          'better-tailwindcss/no-restricted-classes': ['error', { restrict: hardCodedColors }],
        },
      },
      {
        files: ['src/components/**/*.test.{ts,tsx}'],
        rules: { 'better-tailwindcss/no-restricted-classes': 'off' },
      },
    ],
    options: { typeAware: true, typeCheck: true },
  },
  pack: {
    entry: ['src/index.ts'],
    platform: 'neutral',
    target: 'es2023',
    tsconfig: 'tsconfig.lib.json',
    dts: true,
    // The components and hooks run on the client; marking the whole bundle lets Next.js App Router
    // Server Components import and render them directly. JS only; the .d.ts files stay plain.
    banner: { js: "'use client'" },
    hooks: {
      // The directive only works as the very first statement; fail the build if anything moved it
      'build:done': ({ chunks }) => {
        for (const chunk of chunks) {
          if (
            chunk.type === 'chunk' &&
            chunk.fileName.endsWith('.js') &&
            !chunk.code.startsWith("'use client'")
          ) {
            throw new Error(`${chunk.fileName} must start with 'use client'`)
          }
        }
      },
    },
    copy: [
      'src/styles/theme.css',
      'src/styles/styles.css',
      'src/styles/typography.css',
      { from: 'src/styles/themes/flat.css', to: 'dist/themes' },
      // The built-in icons' license notices (ISC + Feather MIT) must ship with the copied paths
      { from: 'src/icons/LICENSE', to: 'dist', rename: 'ICONS-LICENSE' },
    ],
  },
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
})
