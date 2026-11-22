'use client'
import { Combobox } from '@weichenlin/swell-ui'
import { useState } from 'react'

const options = [
  { value: 'payment-api', label: 'Payment API' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'admin', label: 'Admin console' },
]

export default function ComboboxSearchError() {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-full max-w-sm">
      <Combobox
        label="Project"
        placeholder="Type to trigger an error"
        options={options}
        searchError={failed ? 'Could not load projects.' : undefined}
        onRetry={() => setFailed(false)}
        onInputValueChange={(_text, details) => {
          if (details.reason === 'input') setFailed(true)
        }}
      />
    </div>
  )
}
