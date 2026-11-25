'use client'
import { Radio, RadioGroup, RadioGroupLabel, RadioGroupItems } from '@weichenlin/swell-ui'

export default function RadioGroupDemo() {
  return (
    <RadioGroup name="plan" defaultValue="pro" className="w-full max-w-sm">
      <RadioGroupLabel>Plan</RadioGroupLabel>
      <RadioGroupItems>
        <Radio value="free" label="Free" />
        <Radio value="pro" label="Pro" />
        <Radio value="team" label="Team" />
      </RadioGroupItems>
    </RadioGroup>
  )
}
