'use client'
import { Button, Tooltip } from '@weichenlin/swell-ui'

export default function TooltipDemo() {
  return (
    <Tooltip content="Pull the latest manifests from Git">
      <Button intent="secondary">Sync</Button>
    </Tooltip>
  )
}
