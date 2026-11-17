'use client'
import { Button, Drawer, DrawerBody, DrawerFooter, DrawerHeader } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function DrawerDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button intent="secondary" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerHeader title="Filters" description="Narrow down the application list." />
        <DrawerBody>
          <p className="m-0">Esc, the backdrop and the close button all ask to close.</p>
        </DrawerBody>
        <DrawerFooter>
          <Button intent="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Apply</Button>
        </DrawerFooter>
      </Drawer>
    </>
  )
}
