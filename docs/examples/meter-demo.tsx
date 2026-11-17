'use client'
import { Meter } from '@weichenlin/swell-ui'

export default function MeterDemo() {
  return (
    <Meter
      className="w-full max-w-sm"
      label="Health"
      summary="9 of 13 report health"
      segments={[
        { label: 'Healthy', value: 9, tone: 'success' },
        { label: 'No health', value: 4, tone: 'neutral' },
      ]}
    />
  )
}
