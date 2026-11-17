'use client'
import { Slider } from '@weichenlin/swell-ui'

export default function SliderMarks() {
  return (
    <Slider
      label="Quality"
      defaultValue={50}
      min={0}
      max={100}
      step={25}
      marks={[
        { value: 0, label: 'Low' },
        { value: 50, label: 'Medium' },
        { value: 100, label: 'High' },
      ]}
      className="w-full max-w-sm"
    />
  )
}
