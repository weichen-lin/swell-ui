import type { Meta, StoryObj } from '@storybook/react-vite'
import { Activity, Boxes, LayoutDashboard, Settings } from 'lucide-react'
import { type ComponentType, type ReactNode, useState } from 'react'
import { Badge } from '../src/components/badge'
import { Button } from '../src/components/button'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../src/components/dialog'
import {
  Tab,
  TabList,
  TabNav,
  TabNavLink,
  TabPanel,
  Tabs,
  type TabsActivationMode,
  type TabsSize,
  type TabsVariant,
} from '../src/components/tabs'
import { DemoNav, useDemoNav } from './_helpers/demo-nav'

type PlaygroundArgs = {
  variant: TabsVariant
  size: TabsSize
  activationMode: TabsActivationMode
}

const meta = {
  title: 'UI/Tabs',
  // No `component`: Tabs is a compound (Tabs / TabList / Tab / TabPanel), so the controls drive a demo
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          '`Tabs` switches panels inside a page (APG tabs: tablist, roving tabindex, arrow keys,',
          '`activationMode` automatic or manual). `TabNav` looks the same but is a `<nav>` of links for',
          "tabs that change the URL; with `asChild` each `TabNavLink` renders your router's Link, which",
          'marks the current one `aria-current="page"` (a plain `<a>` stands in here).',
          'Variants: `line` for page sections, `segmented` for small view switches (Dialog, card).',
          'The selection indicator slides between tabs in every direction; on `line`, a hover pill',
          'glides with the pointer and stays on the last hovered tab until the pointer leaves the bar.',
        ].join(' '),
      },
    },
  },
  args: { variant: 'line', size: 'md', activationMode: 'automatic' },
  argTypes: {
    variant: { control: 'radio', options: ['line', 'segmented'] },
    size: { control: 'radio', options: ['sm', 'md'] },
    activationMode: { control: 'radio', options: ['automatic', 'manual'] },
  },
} satisfies Meta<PlaygroundArgs>

export default meta
type Story = StoryObj<Meta<PlaygroundArgs>>

const sections = [
  { value: 'overview', label: 'Overview', icon: <LayoutDashboard /> },
  { value: 'resources', label: 'Resources', icon: <Boxes /> },
  { value: 'activity', label: 'Activity', icon: <Activity /> },
  { value: 'settings', label: 'Settings', icon: <Settings /> },
]

function Panel({ children }: { children: ReactNode }) {
  return <p className="m-0 pt-4 text-sm text-fg-muted">{children}</p>
}

function SectionTabs({
  label = 'Application',
  icons = false,
  ...props
}: Partial<PlaygroundArgs> & { label?: string; icons?: boolean }) {
  return (
    <Tabs aria-label={label} defaultValue="overview" {...props}>
      <TabList>
        {sections.map((s) => (
          <Tab key={s.value} value={s.value} icon={icons ? s.icon : undefined}>
            {s.label}
          </Tab>
        ))}
      </TabList>
      {sections.map((s) => (
        <TabPanel key={s.value} value={s.value}>
          <Panel>{s.label} of checkout-api.</Panel>
        </TabPanel>
      ))}
    </Tabs>
  )
}

export const Playground: Story = {
  render: (args) => (
    <div className="w-140 max-w-full">
      <SectionTabs {...args} />
    </div>
  ),
}

/**
 * Page sections (Vercel-style). Hover the bar: the pill glides between tabs and fades only when
 * the pointer leaves it. Two instances on one page: each indicator follows only its own list.
 */
export const Line: Story = {
  render: () => (
    <div className="flex w-140 max-w-full flex-col gap-8">
      <SectionTabs label="Application" icons />
      <SectionTabs label="Application (small)" size="sm" />
    </div>
  ),
}

function ViewSwitch({ size }: { size?: TabsSize }) {
  return (
    <Tabs aria-label={`View (${size})`} defaultValue="tree" variant="segmented" size={size}>
      <TabList>
        <Tab value="tree">Tree</Tab>
        <Tab value="list">List</Tab>
        <Tab value="network">Network</Tab>
      </TabList>
    </Tabs>
  )
}

/** A small view switch (Geist Switch): a soft knob slides inside a hairline frame. */
export const Segmented: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <ViewSwitch size="md" />
      <ViewSwitch size="sm" />
    </div>
  ),
}

/** `md` and `sm` of both variants: line bars 48/40px, segmented 36/32px. */
export const Sizes: Story = {
  render: () => (
    <div className="flex w-140 max-w-full flex-col gap-8">
      <SectionTabs label="Application (md)" size="md" />
      <SectionTabs label="Application (sm)" size="sm" />
      <div className="flex items-center gap-4">
        <ViewSwitch size="md" />
        <ViewSwitch size="sm" />
      </div>
    </div>
  ),
}

/** Counts and warnings sit 8px after the label and are part of the tab's name ("Resources 12"). */
export const WithBadges: Story = {
  render: () => (
    <div className="w-140 max-w-full">
      <Tabs aria-label="Application" defaultValue="overview">
        <TabList>
          <Tab value="overview" icon={<LayoutDashboard />}>
            Overview
          </Tab>
          <Tab value="resources" icon={<Boxes />} badge={<Badge size="sm">12</Badge>}>
            Resources
          </Tab>
          <Tab
            value="activity"
            icon={<Activity />}
            badge={
              <Badge size="sm" tone="warning" context="Warnings">
                2
              </Badge>
            }
          >
            Activity
          </Tab>
          <Tab value="settings" icon={<Settings />} disabled>
            Settings
          </Tab>
        </TabList>
        <TabPanel value="overview">
          <Panel>Healthy, synced to 9f3c2a1.</Panel>
        </TabPanel>
        <TabPanel value="resources">
          <Panel>12 resources in payments.</Panel>
        </TabPanel>
        <TabPanel value="activity">
          <Panel>2 warnings in the last sync.</Panel>
        </TabPanel>
      </Tabs>
    </div>
  ),
}

const many = [
  'Overview',
  'Resources',
  'Activity',
  'Events',
  'Logs',
  'Manifest',
  'Diff',
  'Parameters',
  'History',
  'Rollback',
  'Notifications',
  'Settings',
]

/** More tabs than fit: the bar scrolls, edges fade, and the focused or selected tab scrolls in. */
export const Overflow: Story = {
  render: () => (
    <div className="w-[320px] rounded-lg border border-border-strong p-3">
      <Tabs aria-label="Application" defaultValue="Overview">
        <TabList>
          {many.map((name) => (
            <Tab key={name} value={name}>
              {name}
            </Tab>
          ))}
        </TabList>
        {many.map((name) => (
          <TabPanel key={name} value={name}>
            <Panel>{name}</Panel>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  ),
}

/** Arrow keys only move focus; Enter or Space selects. For panels that fetch when shown. */
export const Manual: Story = {
  render: () => (
    <div className="w-140 max-w-full">
      <SectionTabs activationMode="manual" />
    </div>
  ),
}

const views = {
  yaml: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: checkout-api\nspec:\n  replicas: 3',
  diff: '  spec:\n-   replicas: 2\n+   replicas: 3',
  events: 'Scaled up replica set checkout-api-7c9 to 3\nPulled image ghcr.io/acme/checkout:9f3c2a1',
}

/** Segmented switch inside a Dialog. */
export const InDialog: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button intent="secondary" onClick={() => setOpen(true)}>
          Inspect resource
        </Button>
        <Dialog open={open} onOpenChange={setOpen} size="lg">
          <DialogHeader title="Deployment checkout-api" description="payments / prod-tw" />
          <DialogBody>
            <Tabs aria-label="Resource view" defaultValue="yaml" variant="segmented" size="sm">
              <TabList>
                <Tab value="yaml">YAML</Tab>
                <Tab value="diff">Diff</Tab>
                <Tab value="events" badge={<Badge size="sm">2</Badge>}>
                  Events
                </Tab>
              </TabList>
              {Object.entries(views).map(([value, text]) => (
                <TabPanel key={value} value={value} className="mt-3">
                  <pre className="m-0 overflow-x-auto rounded-md bg-input-bg p-3 font-mono text-xs/5">
                    {text}
                  </pre>
                </TabPanel>
              ))}
            </Tabs>
          </DialogBody>
          <DialogFooter>
            <Button intent="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      </>
    )
  },
}

const pages: Record<string, string> = {
  '/': 'Overview: healthy, synced to 9f3c2a1.',
  '/resources': 'Resources: 12 in payments.',
  '/activity': 'Activity: 2 warnings in the last sync.',
}

function CurrentPage() {
  const { path } = useDemoNav()
  return (
    <div className="pt-4 text-sm text-fg-muted">
      <p className="m-0">{pages[path]}</p>
      <p className="m-0 mt-2 font-mono text-xs text-fg-subtle">{path}</p>
    </div>
  )
}

// Each story keeps its own current path, so the Docs page can show several side by side
const withNav = (Story: ComponentType) => (
  <DemoNav initialPath="/">
    <div className="w-140 max-w-full">
      <Story />
      <CurrentPage />
    </div>
  </DemoNav>
)

const sectionLinks = [
  { to: '/', label: 'Overview', icon: <LayoutDashboard /> },
  { to: '/resources', label: 'Resources', icon: <Boxes />, badge: <Badge size="sm">12</Badge> },
  { to: '/activity', label: 'Activity', icon: <Activity /> },
]

function AppSections({
  label = 'Application sections',
  variant,
  size,
}: {
  label?: string
  variant?: TabsVariant
  size?: TabsSize
}) {
  const { path, go } = useDemoNav()
  return (
    <TabNav aria-label={label} variant={variant} size={size}>
      {sectionLinks.map((link) => (
        <TabNavLink key={link.to} asChild icon={link.icon} badge={link.badge}>
          <a
            href={link.to}
            aria-current={path === link.to ? 'page' : undefined}
            onClick={go(link.to)}
          >
            {link.label}
          </a>
        </TabNavLink>
      ))}
    </TabNav>
  )
}

/**
 * Tabs that change the URL: links in a nav. The path below the page shows the current URL. Both
 * navs read the same path, so either one moves both indicators.
 */
export const TabNavigation: Story = {
  name: 'TabNav',
  decorators: [withNav],
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <AppSections />
      <AppSections label="Application sections (compact)" variant="segmented" size="sm" />
    </div>
  ),
}
