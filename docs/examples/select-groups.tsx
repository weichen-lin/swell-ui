'use client'
import { Select } from '@weichenlin/swell-ui'

export default function SelectGroups() {
  return (
    <div className="w-full max-w-sm">
      <Select
        label="Cluster"
        placeholder="Choose a cluster"
        options={[
          {
            label: 'Production',
            options: [
              { value: 'prod-a', label: 'prod-a' },
              { value: 'prod-b', label: 'prod-b' },
            ],
          },
          {
            label: 'Staging',
            options: [
              { value: 'stg-a', label: 'stg-a' },
              { value: 'stg-b', label: 'stg-b', disabled: true },
            ],
          },
        ]}
      />
    </div>
  )
}
