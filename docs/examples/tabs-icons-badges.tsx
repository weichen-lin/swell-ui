'use client'
import { Badge, Tab, TabList, TabPanel, Tabs } from '@weichenlin/swell-ui'
import { Boxes, History } from 'lucide-react'

export default function TabsIconsBadges() {
  return (
    <Tabs defaultValue="resources" aria-label="Application" className="w-full max-w-md">
      <TabList>
        <Tab value="resources" icon={<Boxes />} badge={<Badge size="sm">12</Badge>}>
          Resources
        </Tab>
        <Tab value="history" icon={<History />}>
          History
        </Tab>
      </TabList>
      <TabPanel value="resources" className="pt-4 text-sm">
        Resources content
      </TabPanel>
      <TabPanel value="history" className="pt-4 text-sm">
        History content
      </TabPanel>
    </Tabs>
  )
}
