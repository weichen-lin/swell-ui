'use client'
import { Meter } from '@weichenlin/swell-ui'

export default function MeterEmpty() {
  return <Meter className="w-full max-w-sm" label="Sync" summary="No resources yet" segments={[]} />
}
