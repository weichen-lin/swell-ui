import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, lazyPlugins } from 'vite-plus'

export default defineConfig({
  fmt: {
    printWidth: 100,
    singleQuote: true,
    semi: false,
    sortImports: { newlinesBetween: false },
    ignorePatterns: ['dist', 'storybook-static'],
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
    options: { typeAware: true, typeCheck: true },
  },
  pack: {
    entry: ['src/index.ts'],
    platform: 'neutral',
    target: 'es2023',
    tsconfig: 'tsconfig.lib.json',
    dts: true,
    copy: ['src/styles/theme.css', 'src/styles/styles.css'],
  },
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
})
