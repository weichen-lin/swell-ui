import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { type Theme, ThemeSwitcher } from '../src/components/theme-switcher'

// Local state only: the story must never touch document's data-theme, which the toolbar owns
function Demo() {
  const [value, setValue] = useState<Theme>('system')
  return <ThemeSwitcher value={value} onChange={setValue} />
}

const meta = {
  title: 'UI/ThemeSwitcher',
  component: ThemeSwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'One-click light/dark toggle for the header or sidebar, with a 44px touch target.',
          'An initial system preference resolves to the visible theme. Controlled by `value` + `onChange`; pair it',
          'with `useTheme`, which persists the choice and sets `data-theme` on the root.',
        ].join(' '),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-xl bg-bg p-6 pt-12">
        <Story />
      </div>
    ),
  ],
  args: { value: 'system', onChange: () => {} },
  argTypes: { value: { control: false }, onChange: { control: false } },
} satisfies Meta<typeof ThemeSwitcher>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { render: () => <Demo /> }
