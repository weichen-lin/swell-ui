'use client'
import { Button } from '@weichenlin/swell-ui'
import { Trash2 } from 'lucide-react'

export default function ButtonDanger() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button tone="danger">Delete project</Button>
      <Button intent="secondary" tone="danger">
        Remove member
      </Button>
      <Button intent="ghost" tone="danger" iconLeft={<Trash2 />}>
        Discard
      </Button>
    </div>
  )
}
