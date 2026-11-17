'use client'
import { Button, Drawer, DrawerBody, DrawerHeader } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function DrawerLeft() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button intent="secondary" onClick={() => setOpen(true)}>
        Open from the left
      </Button>
      <Drawer open={open} onOpenChange={setOpen} side="left" size="sm">
        <DrawerHeader title="Navigation" />
        <DrawerBody>
          <p className="m-0">A small panel pinned to the left edge.</p>
        </DrawerBody>
      </Drawer>
    </>
  )
}
