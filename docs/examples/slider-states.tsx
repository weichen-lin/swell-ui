'use client'
import { Slider } from '@weichenlin/swell-ui'

export default function SliderStates() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Slider label="Disabled" defaultValue={30} disabled />
      <Slider label="Invalid" defaultValue={90} error="Must be 80 or lower" />
    </div>
  )
}
