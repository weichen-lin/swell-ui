'use client'
import { Radio, RadioGroup, RadioGroupLabel, RadioGroupItems } from '@weichenlin/swell-ui'

export default function RadioGroupCard() {
  return (
    <RadioGroup
      name="billing"
      variant="card"
      orientation="horizontal"
      defaultValue="monthly"
      className="w-full max-w-lg"
    >
      <RadioGroupLabel>Billing</RadioGroupLabel>
      <RadioGroupItems>
        <Radio value="monthly" label="Monthly" description="$12 per month" />
        <Radio value="yearly" label="Yearly" description="$120 per year" />
      </RadioGroupItems>
    </RadioGroup>
  )
}
