'use client'
import { Badge } from '@weichenlin/swell-ui'

export default function BadgeBusy() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone="info" busy context="Operation">
        Running
      </Badge>
      <Badge tone="neutral" busy context="Operation">
        Terminating
      </Badge>
    </div>
  )
}
