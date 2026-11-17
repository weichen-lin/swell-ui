'use client'
import { type Theme, ThemeSwitcher } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function ThemeSwitcherDemo() {
  const [value, setValue] = useState<Theme>('light')
  return (
    <div className="flex items-center gap-3">
      <ThemeSwitcher value={value} onChange={setValue} />
      <span className="text-sm">Current value: {value}</span>
    </div>
  )
}
