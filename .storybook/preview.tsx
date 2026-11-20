import type { Preview } from '@storybook/react-vite'
import '../src/styles/dev.css'
import flatCss from '../src/styles/themes/flat.css?inline'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    material: {
      description: 'Material (flat.css token overrides)',
      toolbar: {
        title: 'Material',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'flat', title: 'Flat' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', material: 'default' },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme === 'dark' ? 'dark' : 'light'
      // flat.css is plain :root overrides, so adding or removing its <style> is the whole switch
      const id = 'swell-flat-theme'
      const existing = document.getElementById(id)
      if (context.globals.material === 'flat' && !existing) {
        const el = document.createElement('style')
        el.id = id
        el.textContent = flatCss
        document.head.append(el)
      } else if (context.globals.material !== 'flat') {
        existing?.remove()
      }
      return <Story />
    },
  ],
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disabled: true },
    a11y: { test: 'todo' },
  },
  tags: ['autodocs'],
}

export default preview
