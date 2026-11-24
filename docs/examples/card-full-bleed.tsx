'use client'
import { Badge, Card, CardContent, CardHeader } from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'

export default function CardFullBleed() {
  return (
    <Card as="section" className="w-full max-w-md">
      <CardHeader title="Sync policy" description="How the app keeps the cluster matching Git." />
      <CardContent className="p-0 [[data-slot=card-header]+&]:pt-3">
        <ul className="divide-y divide-border">
          {['Automatic deployment', 'Self-heal', 'Prune'].map((name, i) => (
            <li key={name} className="flex items-center gap-4 px-5 py-4">
              <ZapIcon aria-hidden className="size-4 text-fg-muted" />
              <span className="flex-1 text-sm font-medium">{name}</span>
              <Badge tone={i < 2 ? 'success' : 'neutral'}>{i < 2 ? 'On' : 'Off'}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function ZapIcon(props: ComponentProps<'svg'>) {
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
      <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
    </svg>
  )
}
