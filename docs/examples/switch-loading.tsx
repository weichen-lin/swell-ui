'use client'
import { Switch } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function SwitchLoading() {
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

  function toggle(next: boolean) {
    setSaving(true)
    setTimeout(() => {
      setEnabled(next)
      setSaving(false)
    }, 1000)
  }

  return (
    <Switch
      label="Save on server"
      checked={enabled}
      loading={saving}
      onChange={(event) => toggle(event.currentTarget.checked)}
    />
  )
}
