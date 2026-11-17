'use client'
import { Alert } from '@weichenlin/swell-ui'

export default function AlertDemo() {
  return (
    <Alert className="w-full max-w-lg" tone="info" title="Next sync at 11:00">
      The order count refreshes after the sync completes.
    </Alert>
  )
}
