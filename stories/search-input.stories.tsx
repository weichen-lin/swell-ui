import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SearchInput } from '../src/components/input'

const sizes = ['sm', 'md', 'lg'] as const
const apps = ['payments-api', 'payments-worker', 'checkout-web', 'ledger-db', 'auth-gateway']

const meta = {
  title: 'UI/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-sm rounded-lg bg-bg p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    'aria-label': 'Search applications',
    placeholder: 'Search applications',
    size: 'md',
    disabled: false,
    readOnly: false,
    mono: false,
    validating: false,
  },
  argTypes: {
    'aria-label': { control: 'text' },
    placeholder: { control: 'text' },
    size: { control: 'radio', options: sizes },
    helperText: { control: 'text' },
    error: { control: 'text' },
    mono: { control: 'boolean' },
    validating: { control: 'boolean' },
    validatingText: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    defaultValue: { control: 'text' },
    onClear: { action: 'cleared' },
  },
} satisfies Meta<typeof SearchInput>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const WithValue: Story = { args: { defaultValue: 'payments' } }

/** Controlled: the list filters as you type; the clear button and Esc go through onChange. */
export const FilteringList: Story = {
  render: function Render(args) {
    const [query, setQuery] = useState('pay')
    const shown = apps.filter((a) => a.includes(query.trim().toLowerCase()))
    return (
      <div className="flex flex-col gap-3">
        <SearchInput {...args} value={query} onChange={(e) => setQuery(e.target.value)} />
        <ul className="m-0 list-none p-0 text-sm text-fg">
          {shown.map((a) => (
            <li key={a} className="py-1 font-mono">
              {a}
            </li>
          ))}
          {shown.length === 0 && <li className="py-1 text-fg-muted">No applications match</li>}
        </ul>
      </div>
    )
  },
}

export const Validating: Story = {
  args: { defaultValue: 'payments', validating: true, validatingText: 'Searching' },
}

export const Disabled: Story = { args: { defaultValue: 'payments', disabled: true } }

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {sizes.map((size) => (
        <SearchInput key={size} {...args} size={size} defaultValue={`size ${size}`} />
      ))}
    </div>
  ),
}
