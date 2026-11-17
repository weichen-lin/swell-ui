'use client'
import { CopyInput } from '@weichenlin/swell-ui'

export default function InputCopy() {
  return (
    <div className="w-full max-w-sm">
      <CopyInput label="Repository URL" value="https://example.com/acme/payments-api.git" />
    </div>
  )
}
