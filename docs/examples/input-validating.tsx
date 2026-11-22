'use client'
import { Input } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function InputValidating() {
  const [name, setName] = useState('payments-api')
  const [checking, setChecking] = useState(false)

  return (
    <div className="w-full max-w-sm">
      <Input
        label="App name"
        value={name}
        onChange={(event) => {
          setName(event.currentTarget.value)
          setChecking(true)
          setTimeout(() => setChecking(false), 800)
        }}
        validating={checking}
        validatingText="Checking availability"
        helperText="Type to check the name."
      />
    </div>
  )
}
