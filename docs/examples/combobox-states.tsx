'use client'
import { Combobox } from '@weichenlin/swell-ui'

const options = [
  { value: 'payment-api', label: 'Payment API' },
  { value: 'analytics', label: 'Analytics' },
]

export default function ComboboxStates() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Combobox label="Invalid" options={options} error="Choose a project." />
      <Combobox label="Read-only" options={options} defaultValue="analytics" readOnly />
      <Combobox label="Disabled" options={options} defaultValue="analytics" disabled />
    </div>
  )
}
