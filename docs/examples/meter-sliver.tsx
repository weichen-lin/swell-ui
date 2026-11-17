'use client'
import { Meter } from '@weichenlin/swell-ui'

export default function MeterSliver() {
  return (
    <Meter
      className="w-full max-w-sm"
      label="Sync"
      summary="Compared with main"
      segments={[
        { label: 'Synced', value: 199, tone: 'success' },
        { label: 'Out of sync', value: 1, tone: 'warning' },
      ]}
    />
  )
}
