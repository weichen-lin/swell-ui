'use client'
import { TabNav, TabNavLink } from '@weichenlin/swell-ui'

export default function TabNavDemo() {
  return (
    <TabNav aria-label="Application sections" className="w-full max-w-md">
      <TabNavLink href="#overview" aria-current="page">
        Overview
      </TabNavLink>
      <TabNavLink href="#resources">Resources</TabNavLink>
      <TabNavLink href="#settings">Settings</TabNavLink>
    </TabNav>
  )
}
