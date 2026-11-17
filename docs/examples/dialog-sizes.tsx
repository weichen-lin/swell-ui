'use client'
import {
  Button,
  Dialog,
  type DialogProps,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from '@weichenlin/swell-ui'
import { useState } from 'react'

const sizes: NonNullable<DialogProps['size']>[] = ['sm', 'md', 'lg']

export default function DialogSizes() {
  const [size, setSize] = useState<NonNullable<DialogProps['size']> | null>(null)
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => (
          <Button key={s} intent="secondary" onClick={() => setSize(s)}>
            {s}
          </Button>
        ))}
      </div>
      <Dialog open={size !== null} onOpenChange={() => setSize(null)} size={size ?? 'md'}>
        <DialogHeader title={`Size ${size ?? ''}`} />
        <DialogBody>The panel is capped at its size&apos;s max width.</DialogBody>
        <DialogFooter>
          <Button onClick={() => setSize(null)}>Done</Button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
