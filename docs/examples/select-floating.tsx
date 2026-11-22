'use client'
import { Select } from '@weichenlin/swell-ui'

export default function SelectFloating() {
  return (
    <div className="w-full max-w-sm">
      <Select
        label="Region"
        floating
        options={[
          { value: 'us-east', label: 'US East' },
          { value: 'eu-west', label: 'EU West' },
          { value: 'ap-south', label: 'Asia Pacific' },
        ]}
      />
    </div>
  )
}
