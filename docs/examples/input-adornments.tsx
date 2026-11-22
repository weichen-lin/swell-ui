'use client'
import { Input } from '@weichenlin/swell-ui'
import { Globe } from 'lucide-react'

export default function InputAdornments() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Input label="Website" start="https://" end=".com" placeholder="example" />
      <Input label="Region" start={<Globe />} mono defaultValue="eu-west-1" />
    </div>
  )
}
