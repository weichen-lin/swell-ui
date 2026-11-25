'use client'
import {
  Radio,
  RadioGroup,
  RadioGroupLabel,
  RadioGroupItems,
  RadioGroupError,
} from '@weichenlin/swell-ui'

export default function RadioGroupStates() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <RadioGroup name="disabled-group" defaultValue="a" disabled>
        <RadioGroupLabel>Disabled group</RadioGroupLabel>
        <RadioGroupItems>
          <Radio value="a" label="Option A" />
          <Radio value="b" label="Option B" />
        </RadioGroupItems>
      </RadioGroup>
      <RadioGroup name="one-disabled" defaultValue="a">
        <RadioGroupLabel>One option disabled</RadioGroupLabel>
        <RadioGroupItems>
          <Radio value="a" label="Option A" />
          <Radio value="b" label="Option B" disabled />
        </RadioGroupItems>
      </RadioGroup>
      <RadioGroup name="invalid-group" required invalid>
        <RadioGroupLabel>Invalid</RadioGroupLabel>
        <RadioGroupItems>
          <Radio value="a" label="Option A" />
          <Radio value="b" label="Option B" />
        </RadioGroupItems>
        <RadioGroupError>Choose an option</RadioGroupError>
      </RadioGroup>
    </div>
  )
}
