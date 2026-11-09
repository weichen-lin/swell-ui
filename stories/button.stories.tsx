import type { Meta, StoryObj } from '@storybook/react-vite'
import { GitBranch, RefreshCw, Settings, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button, type ButtonProps } from '../src/components/button'
import { iconArgType } from './_helpers/story-icons'

const intents = ['primary', 'secondary', 'surface', 'dark', 'ghost'] as const
const sizes = ['sm', 'md', 'lg'] as const

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Button',
    intent: 'primary',
    size: 'md',
    tone: 'default',
    fullWidth: false,
    disabled: false,
    loading: false,
    ripple: true,
  },
  argTypes: {
    intent: { control: 'select', options: intents },
    size: { control: 'radio', options: sizes },
    tone: { control: 'radio', options: ['default', 'danger'] },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
    disabledReason: { control: 'text' },
    loading: { control: 'boolean' },
    loadingText: { control: 'text' },
    ripple: { control: 'boolean' },
    iconLeft: iconArgType,
    iconRight: iconArgType,
    children: { control: 'text' },
    // Setting `icon` switches to the square icon-only button; aria-label and the tooltip props apply then
    icon: iconArgType,
    'aria-label': { control: 'text' },
    tooltip: { control: 'boolean' },
    tooltipSide: { control: 'radio', options: ['top', 'bottom'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Story args span both Button shapes; drop the icon-only keys before rendering text buttons
function textArgs({ icon: _icon, tooltip: _tooltip, tooltipSide: _side, ...args }: ButtonProps) {
  return args
}

export const Playground: Story = {}
export const Primary: Story = { args: { intent: 'primary', children: 'Primary' } }
export const Secondary: Story = { args: { intent: 'secondary', children: 'Secondary' } }
export const Surface: Story = { args: { intent: 'surface', children: 'Surface' } }
export const Dark: Story = { args: { intent: 'dark', children: 'Dark' } }
export const Ghost: Story = { args: { intent: 'ghost', children: 'Ghost' } }
export const Danger: Story = { args: { tone: 'danger', children: 'Delete application' } }
export const Loading: Story = {
  args: { loading: true, loadingText: 'Saving changes', children: 'Saving changes' },
}
export const DisabledWithReason: Story = {
  args: {
    disabled: true,
    disabledReason: 'You need the deployer role in production',
    children: 'Deploy',
  },
}
export const WithIcons: Story = {
  args: { intent: 'secondary', iconLeft: 'GitBranch', children: 'main' },
}
export const FullWidth: Story = {
  parameters: { layout: 'padded' },
  args: { fullWidth: true, children: 'Sync all applications' },
}

/** Click to start a 2s async action; focus stays on the button and the live region announces it. */
export const AsyncAction: Story = {
  render: function Render(args) {
    const [loading, setLoading] = useState(false)
    return (
      <Button
        {...textArgs(args)}
        iconLeft={<RefreshCw />}
        loading={loading}
        loadingText="Syncing payments-api"
        onClick={() => {
          setLoading(true)
          setTimeout(() => setLoading(false), 2000)
        }}
      >
        Sync
      </Button>
    )
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4 rounded-lg bg-bg p-6">
      {sizes.map((size) => (
        <Button key={size} {...textArgs(args)} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
}

export const IconSlots: Story = {
  render: (args) => (
    <div className="grid grid-cols-[repeat(3,max-content)] items-center gap-4 rounded-lg bg-bg p-6">
      {sizes.map((size) => (
        <div key={size} className="contents">
          <Button {...textArgs(args)} size={size} iconLeft={<GitBranch />}>
            Branch
          </Button>
          <Button {...textArgs(args)} size={size} iconRight={<RefreshCw />}>
            Sync
          </Button>
          <Button {...textArgs(args)} size={size} tone="danger" iconLeft={<Trash2 />}>
            Delete
          </Button>
        </div>
      ))}
    </div>
  ),
}

const rows = [
  ...(['default', 'disabled', 'loading'] as const).flatMap((state) =>
    intents.map((intent) => ({ intent, state, tone: 'default' as const })),
  ),
  ...intents.map((intent) => ({ intent, state: 'default' as const, tone: 'danger' as const })),
]

export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(3,max-content)] items-center gap-4 rounded-lg bg-bg p-6">
      {rows.map(({ intent, state, tone }) => (
        <div key={`${intent}-${state}-${tone}`} className="contents">
          <span className="text-sm text-fg-muted">
            {intent}
            {tone === 'danger' ? ' + danger' : ''}
            {state === 'default' ? '' : ` (${state})`}
          </span>
          {sizes.map((size) => (
            <Button
              key={size}
              {...textArgs(args)}
              intent={intent}
              size={size}
              tone={tone}
              disabled={state === 'disabled'}
              loading={state === 'loading'}
            >
              {size}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
}

const iconIntents = ['primary', 'secondary', 'surface', 'dark', 'ghost'] as const
const iconOnlyArgs = {
  icon: 'RefreshCw',
  'aria-label': 'Sync now',
  children: undefined,
  intent: 'secondary',
  tooltip: true,
  tooltipSide: 'top',
} as const

export const IconOnly: Story = { args: iconOnlyArgs }
export const IconOnlyLoading: Story = { args: { ...iconOnlyArgs, loading: true } }
export const IconOnlyDisabledWithReason: Story = {
  args: {
    ...iconOnlyArgs,
    icon: 'Trash2',
    'aria-label': 'Delete application',
    tone: 'danger',
    disabled: true,
    disabledReason: 'Production apps are protected',
  },
}

export const IconOnlyAllVariants: Story = {
  parameters: { layout: 'padded' },
  args: iconOnlyArgs,
  render: ({
    tone,
    disabled,
    disabledReason,
    loading,
    loadingText,
    ripple,
    tooltip,
    tooltipSide,
  }) => {
    const shared = { disabled, disabledReason, loading, loadingText, ripple, tooltip, tooltipSide }
    return (
      <div className="grid grid-cols-[auto_repeat(3,max-content)] items-center gap-4 rounded-lg bg-bg p-6">
        {iconIntents.map((intent) => (
          <div key={intent} className="contents">
            <span className="text-sm text-fg-muted">{intent}</span>
            {sizes.map((size) => (
              <Button
                key={size}
                {...shared}
                tone={tone}
                intent={intent}
                size={size}
                icon={<Settings />}
                aria-label="Settings"
              />
            ))}
          </div>
        ))}
        <span className="text-sm text-fg-muted">ghost + danger</span>
        {sizes.map((size) => (
          <Button
            key={size}
            {...shared}
            intent="ghost"
            tone="danger"
            size={size}
            icon={<Trash2 />}
            aria-label="Delete"
          />
        ))}
      </div>
    )
  },
}
