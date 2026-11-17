'use client'
import { Badge } from '@weichenlin/swell-ui'

export default function BadgeVariants() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone="info" variant="subtle">
        Subtle
      </Badge>
      <Badge tone="info" variant="outline">
        Outline
      </Badge>
      <Badge tone="info" variant="solid">
        Solid
      </Badge>
    </div>
  )
}
