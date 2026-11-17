'use client'
import { Button, toast } from '@weichenlin/swell-ui'

export default function ToastDemo() {
  return (
    <Button
      intent="secondary"
      onClick={() =>
        toast({ title: 'Changes saved', description: 'Your settings are up to date.' })
      }
    >
      Show toast
    </Button>
  )
}
