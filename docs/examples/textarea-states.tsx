'use client'
import { Textarea } from '@weichenlin/swell-ui'

export default function TextareaStates() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Textarea label="Floating label" floating />
      <Textarea label="Disabled" disabled defaultValue="Cannot edit" />
      <Textarea label="Invalid" error="This field is required" required />
      <Textarea label="Config" mono size="sm" defaultValue={'{ "debug": true }'} />
    </div>
  )
}
