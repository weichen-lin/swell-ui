'use client'
import { Radio, RadioGroup } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function RadioGroupControlled() {
  const [value, setValue] = useState('email')

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <RadioGroup
        name="contact"
        legend="Contact method"
        description="How should we reach you?"
        value={value}
        onValueChange={setValue}
      >
        <Radio value="email" label="Email" />
        <Radio value="phone" label="Phone" />
      </RadioGroup>
      <p className="text-sm text-fg-muted">Selected: {value}</p>
    </div>
  )
}
