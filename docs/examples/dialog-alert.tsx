'use client'
import { Button, Dialog, DialogFooter, DialogHeader } from '@weichenlin/swell-ui'
import type { ComponentProps } from 'react'
import { useState } from 'react'

export default function DialogAlert() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        intent="secondary"
        tone="danger"
        iconLeft={<Trash2Icon />}
        onClick={() => setOpen(true)}
      >
        Delete
      </Button>
      <Dialog open={open} onOpenChange={setOpen} size="sm" alert>
        <DialogHeader
          title="Delete checkout-api?"
          description="The application and its resources are removed. This can't be undone."
        />
        <DialogFooter>
          {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- alert dialogs start on the safe action */}
          <Button intent="secondary" autoFocus onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button tone="danger" onClick={() => setOpen(false)}>
            Delete application
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}

// Any SVG or icon component works; these draw Lucide icons (ISC License).
function Trash2Icon(props: ComponentProps<'svg'>) {
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
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}
