'use client'
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button intent="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader title="Sync app" description="Deploy the latest revision to prod-tw." />
        <DialogBody>
          <p className="m-0">Esc, the backdrop and the close button all ask to close.</p>
        </DialogBody>
        <DialogFooter>
          <Button intent="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Sync</Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
