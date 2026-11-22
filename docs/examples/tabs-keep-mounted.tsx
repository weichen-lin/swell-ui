'use client'
import { Input, Tab, TabList, TabPanel, Tabs } from '@weichenlin/swell-ui'

export default function TabsKeepMounted() {
  return (
    <Tabs defaultValue="profile" aria-label="Settings" className="w-full max-w-md">
      <TabList>
        <Tab value="profile">Profile</Tab>
        <Tab value="security">Security</Tab>
      </TabList>
      <TabPanel value="profile" keepMounted className="pt-4">
        <Input label="Display name" />
      </TabPanel>
      <TabPanel value="security" keepMounted className="pt-4 text-sm">
        What you type in Profile is still there when you come back.
      </TabPanel>
    </Tabs>
  )
}
