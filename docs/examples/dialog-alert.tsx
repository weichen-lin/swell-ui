'use client'
import { Button, Dialog, DialogFooter, DialogHeader } from '@weichenlin/swell-ui'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function DialogAlert() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button intent="secondary" tone="danger" iconLeft={<Trash2 />} onClick={() => setOpen(true)}>
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
