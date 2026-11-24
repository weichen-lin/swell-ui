'use client'
import { Card, CardContent, CardHeader } from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'

export default function CardAction() {
  return (
    <Card as="section" className="w-full max-w-md">
      <CardHeader
        title="Resources"
        action={
          <a
            href="#resources"
            className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-fg"
          >
            View all
            <ArrowRightIcon aria-hidden className="size-3.5" />
          </a>
        }
      />
      <CardContent>
        <span className="font-serif text-5xl/12 font-medium">13</span>
      </CardContent>
    </Card>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function ArrowRightIcon(props: ComponentProps<'svg'>) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
