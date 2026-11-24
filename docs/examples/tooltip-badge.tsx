'use client'
import { Badge, Tooltip } from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'

export default function TooltipBadge() {
  return (
    <Tooltip content="Finished 21h ago">
      <span
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the tooltip needs a focusable trigger
        tabIndex={0}
        className="rounded-md focus-visible:outline-2 focus-visible:outline-focus"
      >
        <Badge tone="success" icon={<CheckIcon />} size="sm">
          Succeeded
        </Badge>
      </span>
    </Tooltip>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function CheckIcon(props: ComponentProps<'svg'>) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
