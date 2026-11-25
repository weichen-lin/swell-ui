'use client'
import {
  Radio,
  RadioGroup,
  RadioGroupLabel,
  RadioGroupDescription,
  RadioGroupItems,
} from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function RadioGroupControlled() {
  const [value, setValue] = useState('email')

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <RadioGroup name="contact" value={value} onValueChange={setValue}>
        <RadioGroupLabel>Contact method</RadioGroupLabel>
        <RadioGroupDescription>How should we reach you?</RadioGroupDescription>
        <RadioGroupItems>
          <Radio value="email" label="Email" />
          <Radio value="phone" label="Phone" />
        </RadioGroupItems>
      </RadioGroup>
      <p className="text-sm text-fg-muted">Selected: {value}</p>
    </div>
  )
}
