'use client'
import { Radio, RadioGroup } from '@weichenlin/swell-ui'

export default function RadioGroupCard() {
  return (
    <RadioGroup
      name="billing"
      legend="Billing"
      variant="card"
      orientation="horizontal"
      defaultValue="monthly"
      className="w-full max-w-lg"
    >
      <Radio value="monthly" label="Monthly" description="$12 per month" />
      <Radio value="yearly" label="Yearly" description="$120 per year" />
    </RadioGroup>
  )
}
