import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyInput, type CopyInputProps } from '../src/components/input'

// Stories use the visible-label form: Storybook's arg inference collapses the label/aria-label union
type StoryArgs = Extract<CopyInputProps, { label: string }>

const sizes = ['sm', 'md', 'lg'] as const

const meta = {
  title: 'UI/CopyInput',
  component: CopyInput,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-xl bg-bg p-6">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Commit SHA',
    value: '3f9c2a1e8b7d4c6f0a5e9d2b1c8f7a6e5d4c3b2a',
    floating: false,
    size: 'md',
    mono: true,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    floating: { control: 'boolean' },
    helperText: { control: 'text' },
    error: { control: 'text' },
    size: { control: 'radio', options: sizes },
    mono: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<StoryArgs>

export default meta
type Story = StoryObj<Meta<StoryArgs>>

export const Playground: Story = {}

export const Image: Story = {
  args: {
    label: 'Image',
    value:
      'ghcr.io/acme/payments-api@sha256:9b2c41f0e7d3a8c5b6e1f4d7a0c3b9e8d2f5a1c4b7e0d3f6a9c2b5e8d1f4a7c0',
    helperText: 'Digest of the image running in production',
  },
}

export const Floating: Story = {
  args: {
    floating: true,
    label: 'Webhook URL',
    value: 'https://cd.example.com/api/webhook/payments-api',
    mono: false,
  },
}

export const Disabled: Story = { args: { disabled: true } }

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {sizes.map((size) => (
        <CopyInput key={size} {...args} size={size} label={`Size ${size}`} />
      ))}
    </div>
  ),
}
