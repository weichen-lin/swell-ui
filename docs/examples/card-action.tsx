'use client'
import { Card, CardContent, CardHeader } from '@weichenlin/swell-ui'
import { ArrowRight } from 'lucide-react'

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
            <ArrowRight aria-hidden className="size-3.5" />
          </a>
        }
      />
      <CardContent>
        <span className="font-serif text-5xl/12 font-medium">13</span>
      </CardContent>
    </Card>
  )
}
