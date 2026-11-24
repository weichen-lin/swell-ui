'use client'
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
} from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'

export default function SidebarDemo() {
  return (
    <SidebarProvider>
      <div className="flex h-96 w-full overflow-hidden rounded-lg border">
        <Sidebar aria-label="Primary" className="h-full">
          <SidebarHeader>
            <strong>Acme</strong>
          </SidebarHeader>
          <SidebarBody>
            <SidebarGroup label="Workspace">
              <SidebarItem href="#overview" aria-current="page">
                <SidebarIcon>
                  <LayoutDashboardIcon />
                </SidebarIcon>
                Overview
              </SidebarItem>
              <SidebarItem href="#projects">
                <SidebarIcon>
                  <FolderKanbanIcon />
                </SidebarIcon>
                Projects
                <SidebarBadge>8</SidebarBadge>
              </SidebarItem>
            </SidebarGroup>
          </SidebarBody>
          <SidebarFooter>
            <SidebarItem href="#settings">
              <SidebarIcon>
                <SettingsIcon />
              </SidebarIcon>
              Settings
            </SidebarItem>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 p-3">
          <SidebarTrigger />
          <p className="m-0 mt-2 text-sm">
            Below 960px the sidebar is hidden and the menu button opens it in a drawer.
          </p>
        </main>
      </div>
    </SidebarProvider>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function FolderKanbanIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <path d="M8 10v4" />
      <path d="M12 10v2" />
      <path d="M16 10v6" />
    </svg>
  )
}

function LayoutDashboardIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}

function SettingsIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
