import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Button } from '../src/components/button'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../src/components/dialog'
import { Toaster, type ToastPosition, type ToastType, toast } from '../src/components/toast'
import { resetToasts } from '../src/components/toast/store'

const types: ToastType[] = ['neutral', 'success', 'info', 'warning', 'danger', 'loading']
const positions: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

type PlaygroundArgs = {
  type: ToastType
  title: string
  description: string
  actionLabel: string
  duration: number
  position: ToastPosition
  visibleToasts: number
}

// The store is module-level: start every story (and leave it) with no toasts
function FreshToasts({ children }: { children: ReactNode }) {
  useEffect(() => {
    resetToasts()
    return () => resetToasts()
  }, [])
  return children
}

const meta = {
  title: 'UI/Toast',
  // No `component`: toasts come from the imperative `toast()` API, so the controls drive a demo
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: [
          'Imperative toasts: call `toast()`, `toast.success()`, `.info()`, `.warning()`, `.error()`',
          'or `.loading()` from anywhere; each returns an id for `toast.update(id, patch)` (in place,',
          'restarts the timer) and `toast.dismiss(id?)`. `toast.promise(promise, { loading, success,',
          'error })` walks one toast through a request. Mount exactly one `<Toaster />` near the app',
          'root, inside the router so a `<Link>` action works (a second one without an id stays',
          'empty). A `<Toaster id>` shows only toasts created with that `toasterId`.',
          'Defaults: 5s, 10s with an action, `danger` and `loading` stay until dismissed; hover,',
          'keyboard focus and a hidden tab pause every timer. F6 (or Alt+T) jumps to the newest',
          'toast and back; Esc closes the focused one. While a modal Dialog is open the toasts move',
          'into it, so they stay visible and clickable above it.',
        ].join(' '),
      },
    },
  },
  decorators: [
    (Story) => (
      <FreshToasts>
        <Story />
      </FreshToasts>
    ),
  ],
  args: {
    type: 'success',
    title: 'Settings saved',
    description: 'Auto-sync applies on the next commit to main.',
    actionLabel: '',
    duration: 0,
    position: 'bottom-right',
    visibleToasts: 3,
  },
  argTypes: {
    type: { control: 'select', options: types },
    title: { control: 'text' },
    description: { control: 'text' },
    actionLabel: { control: 'text', description: 'Empty for no action' },
    duration: { control: 'number', description: 'ms; 0 uses the default for the type' },
    position: { control: 'select', options: positions },
    visibleToasts: { control: { type: 'number', min: 1, max: 6 } },
  },
} satisfies Meta<PlaygroundArgs>

export default meta
type Story = StoryObj<Meta<PlaygroundArgs>>

export const Playground: Story = {
  render: function Render({
    type,
    title,
    description,
    actionLabel,
    duration,
    position,
    visibleToasts,
  }) {
    return (
      <>
        <Button
          onClick={() =>
            toast({
              type,
              title,
              description: description || undefined,
              action: actionLabel ? { label: actionLabel } : undefined,
              duration: duration > 0 ? duration : undefined,
              toasterId: 'playground',
            })
          }
        >
          Show toast
        </Button>
        {/* Own id: on the docs page every story mounts a Toaster, and this one has its own settings */}
        <Toaster id="playground" position={position} visibleToasts={visibleToasts} />
      </>
    )
  },
}

const samples: Record<ToastType, () => string> = {
  neutral: () =>
    toast({ title: 'Link copied', description: 'Paste it into the incident channel.' }),
  success: () =>
    toast.success('checkout-api synced', { description: 'Synced and Healthy at 4f2c1a9.' }),
  info: () =>
    toast.info('Sync request accepted', { description: 'Argo CD is applying the change.' }),
  warning: () =>
    toast.warning('Drift detected', { description: '2 resources differ from Git on prod-eu.' }),
  danger: () =>
    toast.error('Sync failed', { description: 'Hook job db-migrate exited with code 1.' }),
  loading: () => toast.loading('Syncing checkout-api…'),
}

export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap justify-center gap-2">
      {types.map((type) => (
        <Button key={type} intent="secondary" onClick={samples[type]}>
          {type}
        </Button>
      ))}
      <Button intent="ghost" onClick={() => toast.dismiss()}>
        Dismiss all
      </Button>
      <Toaster />
    </div>
  ),
}

const stackTitles = [
  'payments-api synced',
  'Preview environment ready',
  'Image tag updated to 1.42.0',
  'Rollout paused on canary',
  'Cache purged for docs site',
]

export const Stacking: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Five toasts at once: the newest in front, two edges behind it, the rest waiting. Hover (or Tab into) the stack to expand it; timers pause while expanded.',
      },
    },
  },
  render: () => (
    <div className="flex gap-2">
      <Button
        onClick={() => {
          stackTitles.forEach((title, i) => {
            const type: ToastType = i === 3 ? 'warning' : i % 2 ? 'info' : 'success'
            toast({ type, title, description: i === 1 ? 'pr-1284.preview.internal' : undefined })
          })
        }}
      >
        Show 5 toasts
      </Button>
      <Button intent="secondary" onClick={() => toast.success('One more')}>
        Add one
      </Button>
      <Button intent="ghost" onClick={() => toast.dismiss()}>
        Dismiss all
      </Button>
      <Toaster />
    </div>
  ),
}

// Timers scheduled by a story, cleared when it unmounts
function useTimers() {
  const timers = useRef<number[]>([])
  useEffect(() => {
    const list = timers.current
    return () => {
      for (const timer of list) window.clearTimeout(timer)
    }
  }, [])
  return (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
}

export const SyncLifecycle: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'One toast narrates the whole sync: loading, accepted (info, not success: the request was only accepted), then the real result. Same node throughout; colors and icon cross-fade, height follows. Failure stays until dismissed and offers Retry.',
      },
    },
  },
  render: function Render() {
    const later = useTimers()
    const start = (fail: boolean) => {
      const id = toast.loading('Syncing checkout-api…', { id: 'sync-checkout-api' })
      later(() => {
        if (fail) {
          toast.update(id, {
            type: 'danger',
            title: 'Sync failed',
            description: 'Hook job db-migrate exited with code 1.',
            action: {
              label: 'Retry',
              onClick: (event) => {
                // Keep the toast: it turns back into the loading state in place
                event.preventDefault()
                start(true)
              },
            },
          })
          return
        }
        toast.update(id, {
          type: 'info',
          title: 'Sync request accepted',
          description: 'Argo CD is applying revision 4f2c1a9 to prod-eu.',
          action: { label: 'View operation' },
        })
        later(
          () =>
            toast.update(id, {
              type: 'success',
              title: 'Sync succeeded',
              description: 'checkout-api is Synced and Healthy.',
            }),
          2000,
        )
      }, 1200)
    }
    return (
      <div className="flex gap-2">
        <Button onClick={() => start(false)}>Sync checkout-api</Button>
        <Button intent="secondary" tone="danger" onClick={() => start(true)}>
          Sync (fails)
        </Button>
        <Toaster />
      </div>
    )
  },
}

export const WithAction: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <>
      <Button
        intent="secondary"
        tone="danger"
        onClick={() =>
          toast({
            title: 'Preview environment deleted',
            description: 'pr-1284 and its 6 resources.',
            action: {
              label: 'Undo',
              onClick: () => toast.success('Preview environment restored'),
            },
          })
        }
      >
        Delete pr-1284
      </Button>
      <Toaster />
    </>
  ),
}

export const InDialog: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'A modal dialog makes the rest of the page inert, top-layer popovers included. While it is open the toast viewport moves into the dialog, so toasts stay visible, clickable and reachable with F6; it moves back when the dialog closes.',
      },
    },
  },
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button intent="secondary" onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
          <DialogHeader
            title="Sync settings"
            description="Toasts raised here show above the dialog."
          />
          <DialogBody>
            <p className="m-0">Try the action button on the toast while the dialog is open.</p>
          </DialogBody>
          <DialogFooter>
            <Button
              intent="secondary"
              onClick={() =>
                toast.info('Webhook test sent', {
                  description: 'Delivery #4821 to hooks.internal.',
                  action: { label: 'Resend', onClick: () => toast.success('Webhook resent') },
                })
              }
            >
              Show toast
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
                toast.success('Sync settings saved')
              }}
            >
              Close and notify
            </Button>
          </DialogFooter>
        </Dialog>
        <Toaster />
      </>
    )
  },
}

export const Positions: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [position, setPosition] = useState<ToastPosition>('bottom-right')
    return (
      <div className="flex max-w-md flex-col items-center gap-4">
        <div className="grid grid-cols-3 gap-2">
          {positions.map((p) => (
            <Button
              key={p}
              size="sm"
              intent={p === position ? 'primary' : 'secondary'}
              aria-pressed={p === position}
              onClick={() => {
                // Toasts already shown would jump across the screen; start clean
                toast.dismiss()
                setPosition(p)
              }}
            >
              {p}
            </Button>
          ))}
        </div>
        <Button onClick={() => toast.success(`Shown at ${position}`, { toasterId: 'positions' })}>
          Show toast
        </Button>
        {/* Own id: on the docs page every story mounts a Toaster, and this one moves */}
        <Toaster id="positions" position={position} />
      </div>
    )
  },
}

export const Mobile: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'At 600px and below (pick a mobile size in the toolbar Viewport menu) cards span the width minus 16px on each side, sit 16px from the edge, and at most 2 show in the stack. Swipe down or right to dismiss.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => {
          toast.success('payments-api synced')
          toast.info('Sync request accepted', { description: 'Argo CD is applying the change.' })
          toast.error('Sync failed', { description: 'Hook job db-migrate exited with code 1.' })
        }}
      >
        Show 3 toasts
      </Button>
      <Toaster />
    </div>
  ),
}
