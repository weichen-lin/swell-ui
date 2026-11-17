'use client'
import { Radio, RadioGroup } from '@weichenlin/swell-ui'

export default function RadioGroupDemo() {
  return (
    <RadioGroup name="plan" legend="Plan" defaultValue="pro" className="w-full max-w-sm">
      <Radio value="free" label="Free" />
      <Radio value="pro" label="Pro" />
      <Radio value="team" label="Team" />
    </RadioGroup>
  )
}
