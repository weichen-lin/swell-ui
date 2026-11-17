'use client'
import { Combobox } from '@weichenlin/swell-ui'
import { Database, Server } from 'lucide-react'

const options = [
  {
    label: 'Production',
    options: [
      { value: 'payment-api', label: 'Payment API', icon: <Server /> },
      { value: 'analytics', label: 'Analytics', icon: <Database /> },
    ],
  },
  {
    label: 'Sandbox',
    options: [
      { value: 'edge-api', label: 'Edge API', icon: <Server /> },
      { value: 'legacy', label: 'Legacy gateway', icon: <Server />, disabled: true },
    ],
  },
]

export default function ComboboxGroups() {
  return (
    <div className="w-full max-w-sm">
      <Combobox label="Project" placeholder="Search projects" options={options} />
    </div>
  )
}
