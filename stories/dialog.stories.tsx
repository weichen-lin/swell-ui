import type { Meta, StoryObj } from '@storybook/react-vite'
import { RefreshCw, Trash2 } from 'lucide-react'
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { Badge } from '../src/components/badge'
import { Button } from '../src/components/button'
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  type DialogSize,
} from '../src/components/dialog'
import { Input } from '../src/components/input'
import { Select, type SelectOption } from '../src/components/select'

const sizes: DialogSize[] = ['sm', 'md', 'lg']

type PlaygroundArgs = {
  title: string
  description: string
  size: DialogSize
  alert: boolean
  dismissible: boolean
  longContent: boolean
}

const meta = {
  title: 'UI/Dialog',
  // No `component`: Dialog needs open/onOpenChange/children, so the controls drive a demo instead
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Modal dialog on the native `<dialog>` + `showModal()`. Controlled through `open` /',
          '`onOpenChange(open, reason)`. Esc, the backdrop and the close button all ask through',
          '`onOpenChange`; `alert` and `dismissible={false}` refuse with a short bounce instead.',
          'Below 640px it becomes a bottom sheet. Use `autoFocus` to pick the first focus:',
          'Cancel for destructive confirmations, the input for type-to-confirm.',
        ].join(' '),
      },
    },
  },
  args: {
    title: 'Sync checkout-api?',
    description: 'Applies the manifests at the target revision to the cluster.',
    size: 'md',
    alert: false,
    dismissible: true,
    longContent: false,
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    size: { control: 'radio', options: sizes },
    alert: { control: 'boolean' },
    dismissible: { control: 'boolean' },
    longContent: { control: 'boolean', description: 'Tall body, to see it scroll' },
  },
} satisfies Meta<PlaygroundArgs>

export default meta
type Story = StoryObj<Meta<PlaygroundArgs>>

function useDisclosure() {
  const [open, setOpen] = useState(false)
  return { open, setOpen, onOpenChange: (next: boolean) => setOpen(next) }
}

function KeyValues({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="m-0 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2.5">
      {rows.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-fg-muted">{key}</dt>
          <dd className="m-0 min-w-0 truncate">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const paragraphs = Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
  <p key={`resource-${n}`} className="mt-0 mb-3">
    Resource {n}: the Deployment, its ReplicaSet and the Service will be updated in place. Pods roll
    one at a time and the old ReplicaSet is kept for rollback.
  </p>
))

export const Playground: Story = {
  render: function Render({ title, description, size, alert, dismissible, longContent }) {
    const { open, setOpen, onOpenChange } = useDisclosure()
    return (
      <>
        <Button intent="secondary" onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        <Dialog
          open={open}
          onOpenChange={onOpenChange}
          size={size}
          alert={alert}
          dismissible={dismissible}
        >
          <DialogHeader title={title} description={description || undefined} />
          <DialogBody>
            {longContent ? (
              paragraphs
            ) : (
              <p className="m-0">
                Esc, the backdrop and the close button ask to close
                {alert || !dismissible ? '; here they bounce instead.' : '.'}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button intent="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Sync app</Button>
          </DialogFooter>
        </Dialog>
      </>
    )
  },
}

/** Non-destructive confirmation: what will happen, where, and at which revision. */
export const SyncConfirm: Story = {
  render: function Render() {
    const { open, setOpen, onOpenChange } = useDisclosure()
    return (
      <>
        <Button iconLeft={<RefreshCw />} onClick={() => setOpen(true)}>
          Sync
        </Button>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogHeader
            title="Sync checkout-api?"
            description="Applies the manifests at the target revision. Changed resources roll out right away."
          />
          <DialogBody>
            <KeyValues
              rows={[
                [
                  'Environment',
                  <Badge key="env" tone="neutral" variant="solid">
                    prod
                  </Badge>,
                ],
                ['Namespace', <span key="ns">payments</span>],
                [
                  'Revision',
                  <span key="rev" className="font-mono">
                    9f3c2a1 (main)
                  </span>,
                ],
              ]}
            />
          </DialogBody>
          <DialogFooter>
            <Button intent="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Sync to prod</Button>
          </DialogFooter>
        </Dialog>
      </>
    )
  },
}

/** `alert`: no close button, the backdrop bounces, and focus starts on Cancel. */
export const DestructiveConfirm: Story = {
  render: function Render() {
    const { open, setOpen, onOpenChange } = useDisclosure()
    return (
      <>
        <Button
          intent="secondary"
          tone="danger"
          iconLeft={<Trash2 />}
          onClick={() => setOpen(true)}
        >
          Delete
        </Button>
        <Dialog open={open} onOpenChange={onOpenChange} size="sm" alert>
          <DialogHeader
            title="Delete checkout-api?"
            description="The application and every resource it manages are removed from prod-tw. This can't be undone."
          />
          <DialogFooter>
            {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- alert dialogs start on the safe action; the dialog moves focus anyway */}
            <Button intent="secondary" autoFocus onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button tone="danger" onClick={() => setOpen(false)}>
              Delete application
            </Button>
          </DialogFooter>
        </Dialog>
      </>
    )
  },
}

const APP_NAME = 'checkout-api'

/** For irreversible, high-impact actions: the delete stays off until the name matches. */
export const TypeToConfirm: Story = {
  render: function Render() {
    const { open, setOpen, onOpenChange } = useDisclosure()
    // Content unmounts on close, but the typed value lives here, so clear it per opening
    const [typed, setTyped] = useState('')
    const matches = typed === APP_NAME
    const submit = (event: FormEvent) => {
      event.preventDefault()
      if (matches) setOpen(false)
    }
    return (
      <>
        <Button
          intent="secondary"
          tone="danger"
          iconLeft={<Trash2 />}
          onClick={() => {
            setTyped('')
            setOpen(true)
          }}
        >
          Delete with cascade
        </Button>
        <Dialog open={open} onOpenChange={onOpenChange} alert>
          <DialogHeader
            title={`Delete ${APP_NAME} and its resources?`}
            description="Cascade delete removes the Deployments, Services and ConfigMaps it manages from prod-tw. This can't be undone."
          />
          {/* contents: the form joins the panel's column, so the footer stays pinned */}
          <form className="contents" onSubmit={submit}>
            <DialogBody>
              <Input
                label={`Type ${APP_NAME} to confirm`}
                mono
                // oxlint-disable-next-line jsx-a11y/no-autofocus -- the dialog opens to type the confirmation; focus starts in the field
                autoFocus
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.currentTarget.value)}
              />
            </DialogBody>
            <DialogFooter>
              <Button intent="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              {/* aria-disabled blocks the click and Enter's implicit submit until the name matches */}
              <Button type="submit" tone="danger" disabled={!matches}>
                Delete application
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </>
    )
  },
}

/** While the request runs, Esc, the backdrop and the close button all bounce. */
export const PendingNotDismissible: Story = {
  render: function Render() {
    const { open, setOpen, onOpenChange } = useDisclosure()
    const [pending, setPending] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
    useEffect(() => () => clearTimeout(timer.current), [])
    const sync = () => {
      setPending(true)
      timer.current = setTimeout(() => {
        setPending(false)
        setOpen(false)
      }, 2000)
    }
    return (
      <>
        <Button onClick={() => setOpen(true)}>Sync</Button>
        <Dialog
          open={open}
          // Only a browser-forced close (Chrome, repeated Esc) can still arrive while pending;
          // keeping `open` true makes the dialog reopen itself
          onOpenChange={(next) => pending || onOpenChange(next)}
          dismissible={!pending}
        >
          <DialogHeader
            title="Sync checkout-api?"
            description="Try Esc or the backdrop while it syncs: the dialog stays put."
          />
          <DialogFooter>
            <Button intent="secondary" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={pending} loadingText="Syncing" onClick={sync}>
              Sync to prod
            </Button>
          </DialogFooter>
        </Dialog>
      </>
    )
  },
}

const clusters: SelectOption[] = [
  { value: 'prod-tw', label: 'prod-tw' },
  { value: 'prod-jp', label: 'prod-jp' },
  { value: 'stg-1', label: 'stg-1' },
]
const policies: SelectOption[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'auto', label: 'Automatic' },
  { value: 'auto-prune', label: 'Automatic with prune' },
]

/** Header and footer stay put; the body scrolls between them. */
export const LongForm: Story = {
  render: function Render() {
    const { open, setOpen, onOpenChange } = useDisclosure()
    return (
      <>
        <Button onClick={() => setOpen(true)}>New application</Button>
        <Dialog open={open} onOpenChange={onOpenChange} size="lg">
          <DialogHeader
            title="New application"
            description="Point Argo CD at a Git path and choose where it deploys."
          />
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault()
              setOpen(false)
            }}
          >
            <DialogBody className="flex flex-col gap-5">
              <Input label="Application name" mono placeholder="checkout-api" />
              <Input label="Project" defaultValue="default" />
              <Input label="Repository URL" start="https://" placeholder="github.com/org/repo" />
              <Input label="Revision" mono defaultValue="HEAD" helperText="Branch, tag or SHA" />
              <Input label="Path" mono placeholder="deploy/overlays/prod" />
              <Select label="Cluster" options={clusters} placeholder="Choose a cluster" />
              <Input label="Namespace" mono placeholder="payments" />
              <Select
                label="Sync policy"
                options={policies}
                defaultValue="manual"
                helperText="Prune deletes resources that are no longer in Git"
              />
              <Input label="Labels" placeholder="team=payments, tier=backend" />
            </DialogBody>
            <DialogFooter>
              <Button intent="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create application</Button>
            </DialogFooter>
          </form>
        </Dialog>
      </>
    )
  },
}

/** sm 384px for confirmations, md 480px (default), lg 640px for wide forms. */
export const Sizes: Story = {
  render: function Render() {
    const [size, setSize] = useState<DialogSize | null>(null)
    // Keep the last size through the exit animation
    const [shown, setShown] = useState<DialogSize>('md')
    return (
      <div className="flex gap-3">
        {sizes.map((s) => (
          <Button
            key={s}
            intent="secondary"
            onClick={() => {
              setShown(s)
              setSize(s)
            }}
          >
            Open {s}
          </Button>
        ))}
        <Dialog open={size !== null} onOpenChange={() => setSize(null)} size={shown}>
          <DialogHeader
            title={`Size ${shown}`}
            description={`max-width ${{ sm: 384, md: 480, lg: 640 }[shown]}px, and never wider than the viewport minus 2rem.`}
          />
          <DialogFooter>
            <Button onClick={() => setSize(null)}>Done</Button>
          </DialogFooter>
        </Dialog>
      </div>
    )
  },
}
