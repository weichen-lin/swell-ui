'use client'
import { Button, Drawer, DrawerBody, DrawerClose } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function DrawerCustomHeader() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button intent="secondary" onClick={() => setOpen(true)}>
        Open navigation
      </Button>
      <Drawer open={open} onOpenChange={setOpen} side="left" size="sm" aria-label="Navigation">
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="font-medium">swell</span>
          <DrawerClose aria-label="Close navigation" />
        </div>
        <DrawerBody>
          <p className="m-0">A custom header names the drawer through aria-label.</p>
        </DrawerBody>
      </Drawer>
    </>
  )
}
