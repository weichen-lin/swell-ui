'use client'
import { Textarea } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function TextareaCount() {
  const [value, setValue] = useState('')

  return (
    <Textarea
      label="Bio"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
      maxLength={120}
      showCount
      className="w-full max-w-sm"
    />
  )
}
