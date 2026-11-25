import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from '../src/components/button'
import { Spinner, type SpinnerProps } from '../src/components/spinner'

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'An indeterminate, Material UI–style circular indicator. The arc grows and recedes as it rotates. Size it with Tailwind size-* and set its color with text-* or inherit it from the parent. Under reduced motion a stationary arc remains. The SVG is decorative; put the localized task message in a status region.',
      },
    },
  },
  args: { className: 'size-8 text-primary' },
  argTypes: {
    className: {
      control: 'select',
      options: [
        'size-4 text-primary',
        'size-5 text-primary',
        'size-8 text-primary',
        'size-10 text-info',
        'size-10 text-success',
      ],
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-8 text-primary">
      {['size-4', 'size-5', 'size-8', 'size-10'].map((size) => (
        <div key={size} className="grid justify-items-center gap-3">
          <Spinner className={size} />
          <code className="text-xs text-fg-muted">{size}</code>
        </div>
      ))}
    </div>
  ),
}

function LoginReturnDemo({ className }: SpinnerProps) {
  const [pending, setPending] = useState(true)

  return (
    <div className="grid gap-5 rounded-surface border border-border-strong bg-surface p-6 text-fg">
      <output aria-atomic="true" className="flex min-h-10 items-center gap-3">
        {pending && <Spinner className={className} />}
        {pending ? '正在完成登入…' : '登入完成'}
      </output>
      <Button intent="secondary" onClick={() => setPending(!pending)}>
        {pending ? '模擬登入完成' : '重新模擬登入'}
      </Button>
    </div>
  )
}

export const LoginReturn: Story = {
  render: (args) => <LoginReturnDemo {...args} />,
}
