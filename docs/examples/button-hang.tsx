'use client'
import { Button, Card, CardContent, CardHeader } from '@weichenlin/swell-ui'

export default function ButtonHang() {
  return (
    <Card as="section" className="w-full max-w-md">
      <CardHeader
        title="Members"
        action={
          <Button intent="ghost" size="sm" hang="end">
            Manage
          </Button>
        }
      />
      <CardContent>
        <p className="text-sm text-fg-muted">3 people have access to this project.</p>
      </CardContent>
    </Card>
  )
}
