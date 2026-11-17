'use client'
import { RangeSlider } from '@weichenlin/swell-ui'

export default function RangeSliderDemo() {
  return (
    <RangeSlider
      label="Price range"
      thumbLabels={['Minimum price', 'Maximum price']}
      defaultValue={[200, 800]}
      min={0}
      max={1000}
      step={50}
      minStepsBetweenThumbs={2}
      name={['priceMin', 'priceMax']}
      formatValue={(value) => `$${value}`}
      className="w-full max-w-sm"
    />
  )
}
