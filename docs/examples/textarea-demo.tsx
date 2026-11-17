'use client'
import { Textarea } from '@weichenlin/swell-ui'

export default function TextareaDemo() {
  return (
    <Textarea
      label="Message"
      name="message"
      placeholder="Write something..."
      helperText="Markdown is supported."
      className="w-full max-w-sm"
    />
  )
}
