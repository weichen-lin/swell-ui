'use client'
import { Badge } from '@weichenlin/swell-ui'
import { Heart } from 'lucide-react'

export default function BadgeDemo() {
  return (
    <Badge tone="success" icon={<Heart />}>
      Healthy
    </Badge>
  )
}
