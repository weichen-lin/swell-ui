'use client'
import { Button, toast } from '@weichenlin/swell-ui'

export default function ToastAction() {
  return (
    <Button
      intent="secondary"
      tone="danger"
      onClick={() =>
        toast({
          title: 'Preview environment deleted',
          description: 'pr-1284 and its 6 resources.',
          action: {
            label: 'Undo',
            onClick: () => toast.success('Preview environment restored'),
          },
        })
      }
    >
      Delete pr-1284
    </Button>
  )
}
