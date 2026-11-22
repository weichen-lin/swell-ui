'use client'
import { Button, toast } from '@weichenlin/swell-ui'

export default function ToastUpdate() {
  return (
    <Button
      intent="secondary"
      onClick={() => {
        const id = toast.loading('Deploying checkout-api...')
        setTimeout(
          () => toast.update(id, { type: 'success', title: 'checkout-api deployed' }),
          1500,
        )
      }}
    >
      Deploy
    </Button>
  )
}
