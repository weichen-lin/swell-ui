'use client'
import { Button } from '@weichenlin/swell-ui'

export default function ButtonDisabled() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button disabled>Save</Button>
      <Button disabled disabledReason="Only admins can publish">
        Publish
      </Button>
    </div>
  )
}
