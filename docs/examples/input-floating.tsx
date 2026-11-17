'use client'
import { Input } from '@weichenlin/swell-ui'

export default function InputFloating() {
  return (
    <div className="w-full max-w-sm">
      <Input floating label="Email" type="email" />
    </div>
  )
}
