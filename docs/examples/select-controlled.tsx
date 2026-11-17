'use client'
import { Select } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function SelectControlled() {
  const [value, setValue] = useState('eu-west')
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Select
        label="Region"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        options={[
          { value: 'us-east', label: 'US East' },
          { value: 'eu-west', label: 'EU West' },
          { value: 'ap-south', label: 'Asia Pacific' },
        ]}
      />
      <p className="text-sm">Selected: {value}</p>
    </div>
  )
}
