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
import { FolderKanban, LayoutDashboard, Settings } from 'lucide-react'

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
                  <LayoutDashboard />
                </SidebarIcon>
                Overview
              </SidebarItem>
              <SidebarItem href="#projects">
                <SidebarIcon>
                  <FolderKanban />
                </SidebarIcon>
                Projects
                <SidebarBadge>8</SidebarBadge>
              </SidebarItem>
            </SidebarGroup>
          </SidebarBody>
          <SidebarFooter>
            <SidebarItem href="#settings">
              <SidebarIcon>
                <Settings />
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
