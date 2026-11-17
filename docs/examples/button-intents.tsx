'use client'
import { Button } from '@weichenlin/swell-ui'

export default function ButtonIntents() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button intent="primary">Primary</Button>
      <Button intent="secondary">Secondary</Button>
      <Button intent="surface">Surface</Button>
      <Button intent="dark">Dark</Button>
      <Button intent="ghost">Ghost</Button>
    </div>
  )
}
