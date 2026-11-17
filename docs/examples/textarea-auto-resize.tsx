'use client'
import { Textarea } from '@weichenlin/swell-ui'

export default function TextareaAutoResize() {
  return (
    <Textarea
      label="Notes"
      autoResize
      minRows={2}
      maxRows={6}
      helperText="Grows with content up to 6 rows."
      className="w-full max-w-sm"
    />
  )
}
