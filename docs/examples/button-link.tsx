'use client'
import { Button } from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'

export default function ButtonLink() {
  return (
    // Same with a router's Link: it becomes the host element
    <Button asChild intent="secondary" iconRight={<ExternalLinkIcon />}>
      <a href="https://github.com/weichen-lin/swell-ui" target="_blank" rel="noreferrer">
        View on GitHub
      </a>
    </Button>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function ExternalLinkIcon(props: ComponentProps<'svg'>) {
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
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  )
}
