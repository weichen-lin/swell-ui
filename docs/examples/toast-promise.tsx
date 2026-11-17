'use client'
import { Button, toast } from '@weichenlin/swell-ui'

export default function ToastPromise() {
  return (
    <Button
      intent="secondary"
      onClick={() =>
        toast.promise(
          new Promise<string>((resolve) => setTimeout(() => resolve('prod-tw'), 1500)),
          {
            loading: 'Syncing app...',
            success: (cluster) => `Synced to ${cluster}`,
            error: 'Sync failed',
          },
        )
      }
    >
      Sync app
    </Button>
  )
}
