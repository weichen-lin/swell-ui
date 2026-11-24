'use client'
import { Button } from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'

export default function ButtonIcons() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button iconLeft={<PlusIcon />}>New project</Button>
      <Button intent="secondary" iconRight={<ArrowRightIcon />}>
        Continue
      </Button>
    </div>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function ArrowRightIcon(props: ComponentProps<'svg'>) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function PlusIcon(props: ComponentProps<'svg'>) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
