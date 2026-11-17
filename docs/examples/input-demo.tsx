'use client'
import { Input } from '@weichenlin/swell-ui'

export default function InputDemo() {
  return (
    <div className="w-full max-w-sm">
      <Input label="Project name" placeholder="payments-api" helperText="Use lowercase letters." />
    </div>
  )
}
