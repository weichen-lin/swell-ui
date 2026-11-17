'use client'
import { Checkbox } from '@weichenlin/swell-ui'

export default function CheckboxStates() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Checkbox label="Checked by default" defaultChecked />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled and checked" disabled defaultChecked />
      <Checkbox label="Invalid" error="You must accept to continue" />
    </div>
  )
}
