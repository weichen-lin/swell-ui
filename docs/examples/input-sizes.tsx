'use client'
import { Input } from '@weichenlin/swell-ui'

export default function InputSizes() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Input size="sm" label="Small" />
      <Input size="md" label="Medium" />
      <Input size="lg" label="Large" />
    </div>
  )
}
