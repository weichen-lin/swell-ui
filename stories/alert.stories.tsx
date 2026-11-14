import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { Alert, type AlertTone } from '../src/components/alert'
import { Button } from '../src/components/button'
import { Card, CardContent, CardHeader } from '../src/components/card'

const tones: AlertTone[] = ['neutral', 'info', 'success', 'warning', 'danger']

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An inline message that stays visible while its condition applies. Provide `onDismiss` to add a close button alongside the optional `action`. The caller controls visibility and can localize `dismissLabel`. For updates that need announcing, use a live region for the message text.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: {
    tone: 'neutral',
    title: 'Scheduled maintenance',
    children: 'Order syncing will pause on Sunday from 02:00 to 02:30.',
  },
  argTypes: {
    tone: { control: 'select', options: tones },
    title: { control: 'text' },
    children: { control: 'text' },
    action: { control: false },
    onDismiss: { control: false },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Tones: Story = {
  render: () => (
    <div className="grid gap-3">
      <Alert>Order sync runs every 30 minutes.</Alert>
      <Alert tone="info" title="Next sync at 11:00">
        The order count refreshes after the sync completes.
      </Alert>
      <Alert tone="success" title="Orders are up to date" />
      <Alert tone="warning" title="Order sync is off">
        Turn it on in settings to import new orders automatically.
      </Alert>
      <Alert tone="danger" title="Couldn’t load the latest orders">
        The list still shows data from 10:42.
      </Alert>
    </div>
  ),
}

function OrderSync({ dismissible = false }: { dismissible?: boolean }) {
  const [updated, setUpdated] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const summary = useRef<HTMLDivElement>(null)

  function retry() {
    setUpdated(true)
    summary.current?.focus()
  }

  function dismiss() {
    setDismissed(true)
    summary.current?.focus()
  }

  return (
    <Card>
      <CardHeader title="Order sync" />
      <CardContent className="space-y-4">
        {!updated && !dismissed && (
          <Alert
            tone="danger"
            title="Couldn’t load the latest orders"
            action={
              <Button intent="secondary" size="sm" onClick={retry}>
                Retry
              </Button>
            }
            onDismiss={dismissible ? dismiss : undefined}
          >
            The list still shows data from 10:42.
          </Alert>
        )}
        <div ref={summary} tabIndex={-1} className="space-y-3 rounded-sm text-sm">
          <div className="flex justify-between gap-3 border-b border-border-strong pb-3">
            <span className="text-fg-muted">Last sync</span>
            <span className="tabular-nums">{updated ? '10:45' : '10:42'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-fg-muted">Orders synced</span>
            <span className="tabular-nums">{updated ? 132 : 128}</span>
          </div>
        </div>
        <output className="sr-only">{updated ? 'Order sync data is now up to date.' : ''}</output>
      </CardContent>
    </Card>
  )
}

export const Persistent: Story = { render: () => <OrderSync /> }

export const DismissibleWithAction: Story = { render: () => <OrderSync dismissible /> }

export const Narrow: Story = {
  render: () => (
    <div className="max-w-xs">
      <OrderSync dismissible />
    </div>
  ),
}
