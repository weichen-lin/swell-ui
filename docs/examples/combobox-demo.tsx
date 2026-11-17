'use client'
import { Combobox } from '@weichenlin/swell-ui'

const options = [
  { value: 'payment-api', label: 'Payment API', description: 'payment-api' },
  { value: 'analytics', label: 'Analytics', description: 'analytics' },
  { value: 'admin', label: 'Admin console', description: 'admin' },
  { value: 'edge-api', label: 'Edge API', description: 'edge-api' },
]

export default function ComboboxDemo() {
  return (
    <div className="w-full max-w-sm">
      <Combobox label="Project" placeholder="Search projects" options={options} />
    </div>
  )
}
