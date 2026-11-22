'use client'
import { Tab, TabList, TabPanel, Tabs } from '@weichenlin/swell-ui'

export default function TabsManual() {
  return (
    <Tabs
      defaultValue="overview"
      activationMode="manual"
      aria-label="Application"
      className="w-full max-w-md"
    >
      <TabList>
        <Tab value="overview">Overview</Tab>
        <Tab value="resources">Resources</Tab>
        <Tab value="history">History</Tab>
      </TabList>
      <TabPanel value="overview" className="pt-4 text-sm">
        Arrow keys move focus only; press Enter or Space to open a tab.
      </TabPanel>
      <TabPanel value="resources" className="pt-4 text-sm">
        Resources content
      </TabPanel>
      <TabPanel value="history" className="pt-4 text-sm">
        History content
      </TabPanel>
    </Tabs>
  )
}
