'use client'
import { Tab, TabList, TabPanel, Tabs } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function TabsSegmented() {
  const [value, setValue] = useState('grid')
  return (
    <Tabs
      value={value}
      onValueChange={setValue}
      variant="segmented"
      size="sm"
      aria-label="Layout"
      className="w-full max-w-md"
    >
      <TabList>
        <Tab value="grid">Grid</Tab>
        <Tab value="list">List</Tab>
        <Tab value="board" disabled>
          Board
        </Tab>
      </TabList>
      <TabPanel value="grid" className="pt-4 text-sm">
        Grid view
      </TabPanel>
      <TabPanel value="list" className="pt-4 text-sm">
        List view
      </TabPanel>
    </Tabs>
  )
}
