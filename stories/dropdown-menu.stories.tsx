import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ChevronDown,
  Copy,
  Ellipsis,
  ExternalLink,
  LogOut,
  RefreshCw,
  Settings,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useId, useState } from 'react'
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  type DropdownMenuContentProps,
} from '../src'

type Args = Pick<DropdownMenuContentProps, 'side' | 'align' | 'sideOffset'>
const meta = {
  title: 'UI/DropdownMenu',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Single-level action menu. Compose with Button or router links using asChild. Native popover keeps the panel above scroll containers, including inside Dialog. Arrow keys, Home/End, typeahead and Escape are supported. Disabled items remain focusable. onSelect runs for keyboard and pointer activation; preventDefault() keeps the menu open. Content defaults to bottom/end with a 6px gap.',
      },
    },
  },
  args: { side: 'bottom', align: 'end', sideOffset: 6 },
  argTypes: {
    side: { control: 'select', options: ['bottom', 'top', 'left', 'right'] },
    align: { control: 'radio', options: ['start', 'center', 'end'] },
    sideOffset: { control: { type: 'range', min: 0, max: 24 } },
  },
} satisfies Meta<Args>
export default meta
type Story = StoryObj<typeof meta>

function Actions({ name = 'checkout-api', ...position }: Args & { name?: string }) {
  const [action, setAction] = useState('')
  const [confirm, setConfirm] = useState(false)
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button intent="ghost" size="sm" icon={<Ellipsis />} aria-label={`Actions for ${name}`} />
        </DropdownMenuTrigger>
        <DropdownMenuContent {...position}>
          <DropdownMenuItem
            iconLeft={<ExternalLink />}
            onSelect={() => setAction(`Viewing ${name}`)}
          >
            View details
          </DropdownMenuItem>
          <DropdownMenuItem
            iconLeft={<Copy />}
            onSelect={() => setAction(`Copy requested for ${name}`)}
          >
            Copy application ID
          </DropdownMenuItem>
          <DropdownMenuItem iconLeft={<RefreshCw />} disabled>
            Retry sync
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" iconLeft={<Trash2 />} onSelect={() => setConfirm(true)}>
            Delete application…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <output className="sr-only">{action}</output>
      <Dialog open={confirm} onOpenChange={setConfirm} alert size="sm">
        <DialogHeader
          title={`Delete ${name}?`}
          description="This demonstration only changes the message below."
        />
        <DialogFooter>
          {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- Focus the safe action in a destructive confirmation. */}
          <Button autoFocus intent="secondary" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
          <Button
            tone="danger"
            onClick={() => {
              setAction(`Deleted ${name} in this demo`)
              setConfirm(false)
            }}
          >
            Delete application
          </Button>
        </DialogFooter>
      </Dialog>
      {action && <p className="mt-3 text-xs text-fg-muted">{action}</p>}
    </div>
  )
}
export const Playground: Story = { render: (args) => <Actions {...args} /> }

export const InTable: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="mx-auto max-w-4xl py-8">
      <Table
        title="Deployments"
        getRowId={(row) => row.name}
        tableClassName="min-w-xl"
        data={['checkout-api', 'billing-worker', 'search-indexer'].map((name) => ({ name }))}
        columns={[
          { id: 'name', header: 'Application', rowHeader: true, cell: ({ name }) => name },
          { id: 'environment', header: 'Environment', cell: () => 'Production' },
          {
            id: 'status',
            header: 'Status',
            cell: () => (
              <Badge tone="success" size="sm">
                Healthy
              </Badge>
            ),
          },
          {
            id: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'end',
            cell: ({ name }) => <Actions {...args} name={name} />,
          },
        ]}
      />
    </div>
  ),
}

function AccountMenu(args: Args) {
  const labelId = useId()
  const [action, setAction] = useState('')
  return (
    <div className="min-h-72">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button intent="secondary" iconRight={<ChevronDown />}>
            Wei-Chen
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent {...args}>
          <DropdownMenuGroup aria-labelledby={labelId}>
            <DropdownMenuLabel id={labelId}>
              <span className="block font-medium text-fg">Wei-Chen Lin</span>Personal workspace
            </DropdownMenuLabel>
            <DropdownMenuItem
              iconLeft={<UserRound />}
              onSelect={() => setAction('Profile selected')}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              iconLeft={<Settings />}
              onSelect={() => setAction('Preferences selected')}
            >
              Preferences
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem iconLeft={<LogOut />} onSelect={() => setAction('Sign out selected')}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <output className="mt-4 block text-sm text-fg-muted">{action}</output>
    </div>
  )
}
export const Account: Story = { render: (args) => <AccountMenu {...args} /> }
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: (args) => <AccountMenu {...args} />,
}

function DialogExample(args: Args) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button intent="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="Application settings" />
        <DialogBody>
          <div className="flex items-center justify-between gap-4">
            <span>checkout-api</span>
            <Actions {...args} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
export const InDialog: Story = { render: (args) => <DialogExample {...args} /> }
export const NearViewportEdge: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="flex min-h-dvh items-end justify-end p-3">
      <Actions {...args} />
    </div>
  ),
}
export const Narrow: Story = {
  parameters: { layout: 'padded', viewport: { value: 'mobile1' } },
  render: (args) => (
    <div className="w-72 max-w-full">
      <div className="flex items-center justify-between gap-3 border-b border-border py-3">
        <span className="text-sm font-medium">checkout-api</span>
        <Actions {...args} />
      </div>
    </div>
  ),
}
export const LongMenu: Story = {
  render: (args) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="secondary" iconRight={<ChevronDown />}>
          Applications
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent {...args}>
        {Array.from({ length: 40 }, (_, index) => (
          <DropdownMenuItem key={index}>Application {index + 1}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
export const Links: Story = {
  render: (args) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="secondary" iconRight={<ChevronDown />}>
          Resources
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent {...args}>
        <DropdownMenuItem asChild>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            React documentation
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled>
          <a href="https://example.com">Unavailable resource</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
function ControlledMenu(args: Args) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [reason, setReason] = useState('')
  return (
    <div className="min-h-64">
      <DropdownMenu
        open={open}
        onOpenChange={(next, why) => {
          setOpen(next)
          setReason(why)
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button intent="secondary">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent {...args}>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setCount(count + 1)
            }}
          >
            Increment and stay open
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setCount(0)}>Reset and close</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <output className="mt-4 block text-sm text-fg-muted">
        Count {count} · {open ? 'Open' : 'Closed'}
        {reason && ` · ${reason}`}
      </output>
    </div>
  )
}
export const Controlled: Story = { render: (args) => <ControlledMenu {...args} /> }

export const DisabledTrigger: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled>
        <Button
          intent="secondary"
          disabledReason="You need editor access."
          iconRight={<ChevronDown />}
        >
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Rename</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
