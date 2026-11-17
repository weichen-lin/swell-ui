'use client'
import { Select } from '@weichenlin/swell-ui'
import { Database, Globe, Server } from 'lucide-react'

export default function SelectIcons() {
  return (
    <div className="w-full max-w-sm">
      <Select
        label="Resource"
        placeholder="Choose a resource"
        options={[
          { value: 'server', label: 'Server', icon: <Server /> },
          { value: 'database', label: 'Database', icon: <Database /> },
          { value: 'site', label: 'Website', icon: <Globe /> },
        ]}
      />
    </div>
  )
}
