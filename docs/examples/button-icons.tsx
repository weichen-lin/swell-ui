'use client'
import { Button } from '@weichenlin/swell-ui'
import { ArrowRight, Plus } from 'lucide-react'

export default function ButtonIcons() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button iconLeft={<Plus />}>New project</Button>
      <Button intent="secondary" iconRight={<ArrowRight />}>
        Continue
      </Button>
    </div>
  )
}
