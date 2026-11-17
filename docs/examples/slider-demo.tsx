'use client'
import { Slider } from '@weichenlin/swell-ui'

export default function SliderDemo() {
  return (
    <Slider
      label="Volume"
      defaultValue={40}
      formatValue={(value) => `${value}%`}
      className="w-full max-w-sm"
    />
  )
}
