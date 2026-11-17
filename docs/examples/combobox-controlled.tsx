'use client'
import { Combobox } from '@weichenlin/swell-ui'
import { useState } from 'react'

const options = [
  { value: 'payment-api', label: 'Payment API' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'admin', label: 'Admin console' },
]

export default function ComboboxControlled() {
  const [value, setValue] = useState<string | null>('analytics')
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Combobox label="Project" options={options} value={value} onValueChange={setValue} />
      <p className="text-sm">Selected: {value ?? 'none'}</p>
    </div>
  )
}
