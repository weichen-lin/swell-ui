'use client'
import { Input } from '@weichenlin/swell-ui'

export default function InputStates() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Input label="Domain" defaultValue="example" error="Enter a full domain name." />
      <Input label="Disabled" defaultValue="Locked" disabled />
      <Input label="Read only" defaultValue="Read-only value" readOnly />
    </div>
  )
}
