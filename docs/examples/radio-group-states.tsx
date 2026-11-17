'use client'
import { Radio, RadioGroup } from '@weichenlin/swell-ui'

export default function RadioGroupStates() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <RadioGroup name="disabled-group" legend="Disabled group" defaultValue="a" disabled>
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
      <RadioGroup name="one-disabled" legend="One option disabled" defaultValue="a">
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" disabled />
      </RadioGroup>
      <RadioGroup name="invalid-group" legend="Invalid" required error="Choose an option">
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
    </div>
  )
}
