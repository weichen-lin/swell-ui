'use client'
import { Badge } from '@weichenlin/swell-ui'

export default function BadgeContext() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone="warning" context="Health">
        Unknown
      </Badge>
      <Badge tone="success" context="Sync">
        Synced
      </Badge>
    </div>
  )
}
