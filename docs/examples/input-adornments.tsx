'use client'
import { Input } from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'

export default function InputAdornments() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Input label="Website" start="https://" end=".com" placeholder="example" />
      <Input label="Region" start={<GlobeIcon />} mono defaultValue="eu-west-1" />
    </div>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function GlobeIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}
