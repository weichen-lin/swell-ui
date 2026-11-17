'use client'
import { Select } from '@weichenlin/swell-ui'

export default function SelectDemo() {
  return (
    <div className="w-full max-w-sm">
      <Select
        label="Region"
        placeholder="Choose a region"
        options={[
          { value: 'us-east', label: 'US East' },
          { value: 'eu-west', label: 'EU West' },
          { value: 'ap-south', label: 'Asia Pacific' },
        ]}
      />
    </div>
  )
}
