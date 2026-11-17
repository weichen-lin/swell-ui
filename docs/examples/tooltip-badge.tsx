'use client'
import { Badge, Tooltip } from '@weichenlin/swell-ui'
import { Check } from 'lucide-react'

export default function TooltipBadge() {
  return (
    <Tooltip content="Finished 21h ago">
      <span
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the tooltip needs a focusable trigger
        tabIndex={0}
        className="rounded-md focus-visible:outline-2 focus-visible:outline-focus"
      >
        <Badge tone="success" icon={<Check />} size="sm">
          Succeeded
        </Badge>
      </span>
    </Tooltip>
  )
}
