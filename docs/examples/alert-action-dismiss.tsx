'use client'
import { Alert, Button } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function AlertActionDismiss() {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <Button intent="secondary" onClick={() => setVisible(true)}>
        Show alert
      </Button>
    )
  }

  return (
    <Alert
      className="w-full max-w-lg"
      tone="danger"
      title="Couldn’t load the latest orders"
      action={
        <Button intent="secondary" size="sm">
          Retry
        </Button>
      }
      onDismiss={() => setVisible(false)}
    >
      The list still shows data from 10:42.
    </Alert>
  )
}
