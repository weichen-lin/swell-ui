'use client'
import { Badge } from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'

export default function BadgeDemo() {
  return (
    <Badge tone="success" icon={<HeartIcon />}>
      Healthy
    </Badge>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function HeartIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
    </svg>
  )
}
