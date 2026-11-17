'use client'
import { Switch } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function SwitchControlled() {
  const [enabled, setEnabled] = useState(true)

  return (
    <Switch
      label="Auto-sync"
      description={enabled ? 'Changes sync automatically.' : 'Sync manually.'}
      checked={enabled}
      onChange={(event) => setEnabled(event.currentTarget.checked)}
    />
  )
}
