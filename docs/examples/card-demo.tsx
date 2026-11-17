'use client'
import { Card, CardContent, CardHeader } from '@weichenlin/swell-ui'

export default function CardDemo() {
  return (
    <Card as="section" className="w-full max-w-md">
      <CardHeader title="Resources" description="Managed in shop-prod" />
      <CardContent className="text-sm text-fg-muted">Any content goes here.</CardContent>
    </Card>
  )
}
