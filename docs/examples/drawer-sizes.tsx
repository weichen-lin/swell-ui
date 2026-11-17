'use client'
import { Button, Drawer, type DrawerProps, DrawerBody, DrawerHeader } from '@weichenlin/swell-ui'
import { useState } from 'react'

const sizes: NonNullable<DrawerProps['size']>[] = ['sm', 'md', 'lg']

export default function DrawerSizes() {
  const [size, setSize] = useState<NonNullable<DrawerProps['size']> | null>(null)
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => (
          <Button key={s} intent="secondary" onClick={() => setSize(s)}>
            {s}
          </Button>
        ))}
      </div>
      <Drawer open={size !== null} onOpenChange={() => setSize(null)} size={size ?? 'md'}>
        <DrawerHeader title={`Size ${size ?? ''}`} />
        <DrawerBody>
          <p className="m-0">sm is 280px, md is 384px, lg is 480px.</p>
        </DrawerBody>
      </Drawer>
    </>
  )
}
