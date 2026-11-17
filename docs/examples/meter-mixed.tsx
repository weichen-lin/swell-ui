'use client'
import { Meter } from '@weichenlin/swell-ui'

export default function MeterMixed() {
  return (
    <Meter
      className="w-full max-w-sm"
      label="Health"
      summary="12 of 13 report health"
      segments={[
        { label: 'Healthy', value: 8, tone: 'success' },
        { label: 'Progressing', value: 2, tone: 'info' },
        { label: 'Missing', value: 1, tone: 'warning' },
        { label: 'Degraded', value: 1, tone: 'danger' },
        { label: 'No health', value: 1, tone: 'neutral' },
      ]}
    />
  )
}
