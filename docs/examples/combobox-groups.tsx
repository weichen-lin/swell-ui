'use client'
import { Combobox } from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'

const options = [
  {
    label: 'Production',
    options: [
      { value: 'payment-api', label: 'Payment API', icon: <ServerIcon /> },
      { value: 'analytics', label: 'Analytics', icon: <DatabaseIcon /> },
    ],
  },
  {
    label: 'Sandbox',
    options: [
      { value: 'edge-api', label: 'Edge API', icon: <ServerIcon /> },
      { value: 'legacy', label: 'Legacy gateway', icon: <ServerIcon />, disabled: true },
    ],
  },
]

export default function ComboboxGroups() {
  return (
    <div className="w-full max-w-sm">
      <Combobox label="Project" placeholder="Search projects" options={options} />
    </div>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function DatabaseIcon(props: ComponentProps<'svg'>) {
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
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}

function ServerIcon(props: ComponentProps<'svg'>) {
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
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  )
}
