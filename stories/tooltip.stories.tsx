import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from '../src/components/badge'
import { Button } from '../src/components/button'
import { Tooltip } from '../src/components/tooltip'
import { Check } from './_helpers/story-icons'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  args: {
    content: 'Pull the latest manifests from Git',
    side: 'top',
    describe: true,
    children: <Button intent="secondary">Sync</Button>,
  },
  argTypes: {
    content: { control: 'text' },
    side: { control: 'radio', options: ['top', 'bottom', 'left', 'right'] },
    describe: { control: 'boolean' },
    children: { control: false },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
export const Bottom: Story = { args: { side: 'bottom' } }
export const Left: Story = { args: { side: 'left' } }
export const Right: Story = { args: { side: 'right' } }

/** Wraps any element; a non-interactive trigger needs tabIndex so keyboard users can reach it. */
export const OnBadge: Story = {
  args: {
    content: 'Finished 21h ago',
    children: (
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the tooltip is the only place the time shows, so the badge must be a tab stop
      <span tabIndex={0} className="rounded-md focus-visible:outline-2 focus-visible:outline-focus">
        <Badge tone="success" icon={<Check />} size="sm">
          Succeeded
        </Badge>
      </span>
    ),
  },
}

/**
 * The bubble is portaled to body with fixed positioning: inside a scroll container it is not
 * clipped, and at the viewport's right edge it is pulled back instead of overflowing.
 */
export const InScrollContainer: Story = {
  args: { content: 'Finished 21h ago · 10/21/2026, 11:14:02 PM' },
  render: (args) => (
    <div className="ml-auto flex h-16 w-64 items-center justify-end overflow-auto rounded-lg border border-border-strong bg-surface px-3">
      <Tooltip {...args}>
        <Button intent="secondary" size="sm">
          Last sync
        </Button>
      </Tooltip>
    </div>
  ),
}

/** aria-disabled buttons still receive hover and focus, so the reason is reachable. */
export const OnDisabledButton: Story = {
  args: {
    content: 'Sync is paused while a rollback is in progress',
    children: (
      <Button intent="secondary" disabled>
        Sync
      </Button>
    ),
  },
}
