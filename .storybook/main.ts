import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  core: { disableTelemetry: true },
  async viteFinal(viteConfig) {
    const { default: tailwindcss } = await import('@tailwindcss/vite')
    const hasTailwind = JSON.stringify(
      ((viteConfig.plugins as unknown[] | undefined) ?? [])
        .flat(Infinity)
        .map((p) => (p as { name?: string })?.name),
    ).includes('tailwindcss')
    return mergeConfig(viteConfig, { plugins: hasTailwind ? [] : [tailwindcss()] })
  },
}

export default config
