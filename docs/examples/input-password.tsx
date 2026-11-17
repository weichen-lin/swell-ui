'use client'
import { PasswordInput } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function InputPassword() {
  const [password, setPassword] = useState('')
  return (
    <div className="w-full max-w-sm">
      <PasswordInput
        label="Password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
      />
    </div>
  )
}
