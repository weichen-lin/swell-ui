'use client'
import { Select } from '@weichenlin/swell-ui'

const options = [
  { value: 'us-east', label: 'US East' },
  { value: 'eu-west', label: 'EU West' },
]

export default function SelectSizes() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Select label="Small" size="sm" options={options} placeholder="Choose a region" />
      <Select label="Medium" size="md" options={options} placeholder="Choose a region" />
      <Select label="Large" size="lg" options={options} placeholder="Choose a region" />
    </div>
  )
}
