'use client'
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function DialogDismissible() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  function save() {
    setPending(true)
    setTimeout(() => {
      setPending(false)
      setOpen(false)
    }, 2000)
  }

  return (
    <>
      <Button intent="secondary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Dialog open={open} onOpenChange={setOpen} dismissible={!pending}>
        <DialogHeader title="Save changes" description="Press Esc while saving to see it refuse." />
        <DialogBody>
          <p className="m-0">
            While the request runs, Esc, the backdrop and the close button wait.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button intent="secondary" disabled={pending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button loading={pending} loadingText="Saving..." onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
