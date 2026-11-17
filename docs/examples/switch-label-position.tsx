'use client'
import { Switch } from '@weichenlin/swell-ui'

export default function SwitchLabelPosition() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Switch labelPosition="start" label="Dark mode" description="Use the dark theme." />
      <Switch labelPosition="start" label="Disabled" disabled />
      <Switch label="Invalid" error="This setting is required" />
    </div>
  )
}
