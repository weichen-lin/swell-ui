import type { Meta, StoryObj } from '@storybook/react-vite'
import { FolderGit2, Layers, Server, SlidersHorizontal } from 'lucide-react'
import { useId, useState } from 'react'
import { Badge } from '../src/components/badge'
import { Button } from '../src/components/button'
import { Checkbox, CheckboxGroup } from '../src/components/checkbox'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  type DrawerSide,
  type DrawerSize,
} from '../src/components/drawer'
import { Input } from '../src/components/input'
import { Select, type SelectOption } from '../src/components/select'

const sides: DrawerSide[] = ['left', 'right']
const sizes: DrawerSize[] = ['sm', 'md', 'lg']

type PlaygroundArgs = {
  title: string
  description: string
  side: DrawerSide
  size: DrawerSize
}

const meta = {
  title: 'UI/Drawer',
  // No `component`: Drawer needs open/onOpenChange/children, so the controls drive a demo instead
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Modal side panel on the native `<dialog>` + `showModal()`, sharing its behavior with',
          'Dialog. Controlled through `open` / `onOpenChange(open, reason)`. It slides in from the',
          '`side` edge (right by default) at a fixed `size` width (sm 280, md 384, lg 480px, capped',
          'at the viewport minus 56px), full height; only `DrawerBody` scrolls. Esc, the backdrop,',
          "the header's close button and `DrawerClose` close it, and focus returns to the trigger.",
          'Needs a name: a `DrawerHeader` title or `aria-label`.',
        ].join(' '),
      },
    },
  },
  args: {
    title: 'Filters',
    description: 'Narrow the project list.',
    side: 'right',
    size: 'md',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    side: { control: 'radio', options: sides },
    size: { control: 'radio', options: sizes },
  },
} satisfies Meta<PlaygroundArgs>

export default meta
type Story = StoryObj<Meta<PlaygroundArgs>>

const clusters: SelectOption[] = [
  { value: 'prod-tw', label: 'prod-tw' },
  { value: 'prod-jp', label: 'prod-jp' },
  { value: 'stg-1', label: 'stg-1' },
]

function FilterFields() {
  return (
    <div className="flex flex-col gap-5 pb-3">
      <Input label="Name contains" placeholder="checkout" />
      <Select label="Cluster" options={clusters} placeholder="Any cluster" />
      <Input label="Namespace" mono placeholder="payments" />
      <CheckboxGroup legend="Health">
        <Checkbox name="health" value="healthy" label="Healthy" defaultChecked />
        <Checkbox name="health" value="progressing" label="Progressing" defaultChecked />
        <Checkbox name="health" value="degraded" label="Degraded" />
        <Checkbox name="health" value="missing" label="Missing" />
      </CheckboxGroup>
    </div>
  )
}

/** Each story keeps its own state, so the Docs page can mount them all at once. */
function FilterDrawer({
  side,
  size,
  title = 'Filters',
  description = 'Narrow the project list.',
  label,
}: {
  side?: DrawerSide
  size?: DrawerSize
  title?: string
  description?: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button intent="secondary" iconLeft={<SlidersHorizontal />} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Drawer open={open} onOpenChange={setOpen} side={side} size={size}>
        <DrawerHeader title={title} description={description || undefined} />
        <DrawerBody>
          <FilterFields />
        </DrawerBody>
        <DrawerFooter>
          <Button intent="secondary" onClick={() => setOpen(false)}>
            Reset
          </Button>
          <Button onClick={() => setOpen(false)}>Apply</Button>
        </DrawerFooter>
      </Drawer>
    </>
  )
}

/** Right edge, md: a filter panel with fields in the body and actions in the footer. */
export const Playground: Story = {
  render: ({ title, description, side, size }) => (
    <FilterDrawer
      label="Open filters"
      title={title}
      description={description}
      side={side}
      size={size}
    />
  ),
}

/** From the left edge: the hairline sits on its right, the inner side. */
export const Left: Story = {
  render: () => <FilterDrawer label="Open left drawer" side="left" />,
}

/** Fixed widths only: sm 280px (navigation), md 384px (default), lg 480px (details). */
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-3">
      {sizes.map((size) => (
        <FilterDrawer key={size} label={`Open ${size}`} size={size} title={`Size ${size}`} />
      ))}
    </div>
  ),
}

const events = Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
  <li
    key={`event-${n}`}
    className="flex items-start gap-3 border-b border-border py-3 last:border-0"
  >
    <Badge size="sm" tone={n % 5 === 0 ? 'warning' : 'neutral'} className="mt-0.5 shrink-0">
      {n % 5 === 0 ? 'Retry' : 'Sync'}
    </Badge>
    <span className="min-w-0">
      Revision {(4096 + n * 37).toString(16)} applied to checkout-api: Deployment, Service and
      ConfigMap updated.
    </span>
  </li>
))

/** A body taller than the viewport scrolls on its own; header and footer stay put. */
export const LongContent: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button intent="secondary" onClick={() => setOpen(true)}>
          Open sync history
        </Button>
        <Drawer open={open} onOpenChange={setOpen} size="lg">
          <DrawerHeader title="Sync history" description="checkout-api on prod-tw, newest first." />
          <DrawerBody>
            <ul className="m-0 list-none p-0">{events}</ul>
          </DrawerBody>
          <DrawerFooter>
            <Button intent="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DrawerFooter>
        </Drawer>
      </>
    )
  },
}

const navItems = [
  { label: 'Projects', icon: <Layers /> },
  { label: 'Clusters', icon: <Server /> },
  { label: 'Repositories', icon: <FolderGit2 /> },
]

/**
 * No DrawerHeader: a custom header row with its own title (named through aria-labelledby) and
 * DrawerClose, which comes wired to close the drawer.
 */
export const CustomHeader: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    const titleId = useId()
    return (
      <>
        <Button intent="secondary" onClick={() => setOpen(true)}>
          Open custom header
        </Button>
        <Drawer open={open} onOpenChange={setOpen} side="left" size="sm" aria-labelledby={titleId}>
          <div className="flex h-14 shrink-0 items-center gap-2 px-3">
            <span aria-hidden className="size-5 rounded-sm bg-primary" />
            <span id={titleId} className="font-serif text-lg/6 text-fg">
              Acme
            </span>
            <DrawerClose aria-label="Close menu" className="ms-auto shrink-0" />
          </div>
          <DrawerBody className="px-3 py-2">
            <ul className="m-0 flex list-none flex-col gap-px p-0">
              {navItems.map((item) => (
                <li key={item.label}>
                  <Button
                    intent="ghost"
                    iconLeft={item.icon}
                    fullWidth
                    className="justify-start"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </DrawerBody>
        </Drawer>
      </>
    )
  },
}
