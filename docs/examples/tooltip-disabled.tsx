'use client'
import { Button, Tooltip } from '@weichenlin/swell-ui'

export default function TooltipDisabled() {
  return (
    <Tooltip content="Sync is paused while a rollback is in progress">
      <Button intent="secondary" disabled>
        Sync
      </Button>
    </Tooltip>
  )
}
