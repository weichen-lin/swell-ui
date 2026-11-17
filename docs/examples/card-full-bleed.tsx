'use client'
import { Badge, Card, CardContent, CardHeader } from '@weichenlin/swell-ui'
import { Zap } from 'lucide-react'

export default function CardFullBleed() {
  return (
    <Card as="section" className="w-full max-w-md">
      <CardHeader title="Sync policy" description="How the app keeps the cluster matching Git." />
      <CardContent className="p-0 [[data-slot=card-header]+&]:pt-3">
        <ul className="divide-y divide-border">
          {['Automatic deployment', 'Self-heal', 'Prune'].map((name, i) => (
            <li key={name} className="flex items-center gap-4 px-5 py-4">
              <Zap aria-hidden className="size-4 text-fg-muted" />
              <span className="flex-1 text-sm font-medium">{name}</span>
              <Badge tone={i < 2 ? 'success' : 'neutral'}>{i < 2 ? 'On' : 'Off'}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
