import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentType, ReactNode } from 'react'
import {
  Sidebar,
  SidebarBadge,
  SidebarBody,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarIcon,
  SidebarItem,
  SidebarProvider,
  SidebarTrigger,
} from '../src/components/sidebar'
import { cn } from '../src/lib/cn'
import { DemoNav, useDemoNav } from './_helpers/demo-nav'
import {
  Activity,
  BookOpen,
  Boxes,
  FileClock,
  FolderGit2,
  GitBranch,
  KeyRound,
  Layers,
  Network,
  Package,
  Rocket,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from './_helpers/story-icons'

const meta = {
  title: 'UI/Sidebar',
  // No `component`: Sidebar is a compound (Provider / Sidebar / Header / Body / Group / Item / Footer / Trigger)
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'App navigation: a `<nav>` of grouped links, the current one marked `aria-current="page"`.',
          "With `asChild`, each `SidebarItem` renders your router's Link (here a plain `<a>` stands in),",
          'which sets href and aria-current. From 960px up it is docked (240px, only the body',
          'scrolls); below 960px it hides and `SidebarTrigger` opens the same content in a drawer',
          '(280px, from the start edge, Esc / backdrop / close button / following an item close it).',
          'Hover the items: a pill glides with the pointer and fades only when it leaves the list.',
        ].join(' '),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type NavItem = { to: string; label: string; icon: ReactNode; badge?: number | string }
type NavGroup = { label?: string; items: NavItem[] }

const projects: NavItem = { to: '/projects', label: 'Projects', icon: <Layers /> }

const groups: NavGroup[] = [
  {
    items: [
      { ...projects, badge: 8 },
      { to: '/activity', label: 'Activity', icon: <Activity /> },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { to: '/rollouts', label: 'Rollouts', icon: <Rocket />, badge: 2 },
      { to: '/sync-history', label: 'Sync history', icon: <FileClock /> },
      { to: '/sources', label: 'Git sources', icon: <GitBranch /> },
      { to: '/repositories', label: 'Repositories', icon: <FolderGit2 /> },
      { to: '/packages', label: 'Helm charts', icon: <Package /> },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { to: '/clusters', label: 'Clusters', icon: <Server />, badge: 3 },
      { to: '/namespaces', label: 'Namespaces', icon: <Boxes /> },
      { to: '/network', label: 'Network policies', icon: <Network /> },
    ],
  },
  {
    label: 'Access',
    items: [
      { to: '/members', label: 'Members', icon: <Users />, badge: 12 },
      { to: '/tokens', label: 'API tokens', icon: <KeyRound /> },
      { to: '/certificates', label: 'Certificates', icon: <ShieldCheck /> },
    ],
  },
  {
    label: 'Help',
    items: [
      { to: '/docs', label: 'Documentation', icon: <BookOpen /> },
      { to: '/settings', label: 'Settings', icon: <Settings /> },
    ],
  },
]

// Each story keeps its own current path, so the Docs page can show them all side by side
const withNav = (Story: ComponentType) => (
  <DemoNav initialPath="/projects">
    <Story />
  </DemoNav>
)

const allItems = groups.flatMap((g) => g.items)

function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="m-0 font-serif text-2xl/tight font-medium text-fg">{title}</h1>
      <p className="m-0 text-sm text-fg-muted">Page content for {title.toLowerCase()}.</p>
      <div className="h-40 rounded-xl border border-dashed border-ring" />
    </div>
  )
}

function Brand() {
  return (
    <span className="flex items-center gap-2 px-2 font-serif text-lg/6 text-fg">
      <span aria-hidden className="size-5 rounded-md bg-primary" />
      Acme
    </span>
  )
}

function NavGroups({ groups, badges = true }: { groups: NavGroup[]; badges?: boolean }) {
  const { path, go } = useDemoNav()
  return groups.map((group) => (
    <SidebarGroup key={group.label ?? 'main'} label={group.label}>
      {group.items.map((item) => (
        <SidebarItem key={item.to} asChild>
          <a
            href={item.to}
            aria-current={path === item.to ? 'page' : undefined}
            onClick={go(item.to)}
          >
            <SidebarIcon>{item.icon}</SidebarIcon>
            {item.label}
            {badges && item.badge != null && <SidebarBadge>{item.badge}</SidebarBadge>}
          </a>
        </SidebarItem>
      ))}
    </SidebarGroup>
  ))
}

function CurrentPage() {
  const { path } = useDemoNav()
  const item = allItems.find((i) => i.to === path)
  return <PagePlaceholder title={item?.label ?? path} />
}

type AppFrameProps = {
  groups: NavGroup[]
  badges?: boolean
  /** Frame height; the sidebar fills it, so a short frame makes the body scroll. */
  height?: string
  /**
   * Show the below-960px layout at any viewport width, so the drawer can be tried on the Docs
   * page: the docked sidebar stays hidden and the trigger stays visible. Story-only overrides.
   */
  narrow?: boolean
}

/** A small app shell: sidebar on the left, a top bar (with the drawer trigger) and a page. */
function AppFrame({ groups, badges, height = 'h-[560px]', narrow = false }: AppFrameProps) {
  return (
    <SidebarProvider>
      <div
        className={cn(
          'flex overflow-hidden rounded-xl border border-border-strong bg-bg text-fg',
          narrow ? 'w-97.5' : 'w-220 max-w-full',
          height,
        )}
      >
        <Sidebar aria-label="Main" className={cn('h-full', narrow && 'min-[960px]:hidden')}>
          <SidebarHeader>
            <Brand />
          </SidebarHeader>
          <SidebarBody>
            <NavGroups groups={groups} badges={badges} />
          </SidebarBody>
          <SidebarFooter>
            <p className="m-0 px-2 text-xs/4 text-fg-subtle">Acme v0.1.0 · prod-tw</p>
          </SidebarFooter>
        </Sidebar>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border-strong px-3">
            <SidebarTrigger className={narrow ? 'min-[960px]:inline-flex' : undefined} />
            <span className="px-1 text-sm font-medium text-fg">payments / prod-tw</span>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto p-6">
            <CurrentPage />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

/** The smallest shell: one item. Narrow the window below 960px to get the menu button instead. */
export const Playground: Story = {
  decorators: [withNav],
  render: () => <AppFrame groups={[{ items: [projects] }]} />,
}

/**
 * Fifteen items in five groups in a short frame: the body scrolls while the header and footer
 * stay put. Run the pointer down the list: the pill glides across items and group labels.
 */
export const GroupsAndScrolling: Story = {
  decorators: [withNav],
  render: () => <AppFrame groups={groups} badges={false} height="h-[480px]" />,
}

/** Counts sit at the end of the item as a small neutral Badge and join its name ("Projects 8"). */
export const WithBadges: Story = {
  decorators: [withNav],
  render: () => <AppFrame groups={groups.slice(0, 3)} />,
}

/**
 * The below-960px layout at any width: press the menu button. The drawer slides in from the
 * left over a backdrop; Esc, a backdrop click, the close button or following an item closes it,
 * and focus returns to the menu button.
 */
export const Drawer: Story = {
  decorators: [withNav],
  render: () => <AppFrame groups={groups} narrow height="h-[480px]" />,
}
