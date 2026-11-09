import type { Meta, StoryObj } from '@storybook/react-vite'
import { KeyRound } from 'lucide-react'
import { PasswordInput } from '../src/components/input'

const sizes = ['sm', 'md', 'lg'] as const

const meta = {
  title: 'UI/PasswordInput',
  component: PasswordInput,
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
    label: 'Registry token',
    floating: false,
    size: 'md',
    required: false,
    disabled: false,
    readOnly: false,
    mono: false,
    validating: false,
    autoComplete: 'current-password',
  },
  argTypes: {
    label: { control: 'text' },
    floating: { control: 'boolean' },
    helperText: { control: 'text' },
    error: { control: 'text' },
    size: { control: 'radio', options: sizes },
    autoComplete: { control: 'radio', options: ['current-password', 'new-password', 'off'] },
    start: {
      control: 'select',
      options: ['none', 'KeyRound'],
      mapping: { none: undefined, KeyRound: <KeyRound /> },
    },
    mono: { control: 'boolean' },
    required: { control: 'boolean' },
    validating: { control: 'boolean' },
    validatingText: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
  },
} satisfies Meta<typeof PasswordInput>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: { defaultValue: 'ghp_8fK2xQ0aZ1', helperText: 'Read-only token for ghcr.io/acme' },
}

export const Floating: Story = {
  args: { floating: true },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <PasswordInput {...args} label="Registry token" />
      <PasswordInput {...args} label="Registry token" defaultValue="ghp_8fK2xQ0aZ1" />
    </div>
  ),
}

export const NewPassword: Story = {
  args: {
    label: 'New webhook secret',
    autoComplete: 'new-password',
    required: true,
    helperText: 'At least 32 characters',
  },
}

export const WithError: Story = {
  name: 'Error',
  args: { defaultValue: 'short', error: 'Token was rejected by ghcr.io (401)' },
}

export const Disabled: Story = { args: { defaultValue: 'ghp_8fK2xQ0aZ1', disabled: true } }

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {sizes.map((size) => (
        <PasswordInput
          key={size}
          {...args}
          size={size}
          label={`Size ${size}`}
          defaultValue="hunter2"
        />
      ))}
    </div>
  ),
}
