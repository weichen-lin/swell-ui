'use client'
import { Slider } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function SliderControlled() {
  const [value, setValue] = useState(50)
  const [committed, setCommitted] = useState(50)

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Slider
        label="Brightness"
        value={value}
        onValueChange={setValue}
        onValueCommit={setCommitted}
        helperText="Commit runs once when the gesture ends."
      />
      <p className="text-sm text-fg-muted">Committed: {committed}</p>
    </div>
  )
}
