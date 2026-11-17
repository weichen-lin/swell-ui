'use client'
import { Switch } from '@weichenlin/swell-ui'

export default function SwitchSizes() {
  return (
    <div className="flex flex-col gap-3">
      <Switch size="sm" label="Small" defaultChecked />
      <Switch size="md" label="Medium" defaultChecked />
    </div>
  )
}
