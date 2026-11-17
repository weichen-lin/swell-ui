'use client'
import { Select } from '@weichenlin/swell-ui'

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
]

export default function SelectStates() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Select label="Invalid" options={options} error="Choose an option." />
      <Select label="Disabled" options={options} defaultValue="a" disabled />
    </div>
  )
}
