'use client'
import { Button, Tooltip } from '@weichenlin/swell-ui'

export default function TooltipSides() {
  return (
    <div className="flex flex-wrap gap-2">
      <Tooltip content="Top" side="top">
        <Button intent="secondary">Top</Button>
      </Tooltip>
      <Tooltip content="Bottom" side="bottom">
        <Button intent="secondary">Bottom</Button>
      </Tooltip>
      <Tooltip content="Left" side="left">
        <Button intent="secondary">Left</Button>
      </Tooltip>
      <Tooltip content="Right" side="right">
        <Button intent="secondary">Right</Button>
      </Tooltip>
    </div>
  )
}
