'use client'
import { Button, toast } from '@weichenlin/swell-ui'

export default function ToastTypes() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button intent="secondary" onClick={() => toast.success('payments-api synced')}>
        Success
      </Button>
      <Button intent="secondary" onClick={() => toast.info('New revision available')}>
        Info
      </Button>
      <Button intent="secondary" onClick={() => toast.warning('Rollout paused on canary')}>
        Warning
      </Button>
      <Button intent="secondary" onClick={() => toast.error('Sync failed')}>
        Error
      </Button>
      <Button intent="ghost" onClick={() => toast.dismiss()}>
        Dismiss all
      </Button>
    </div>
  )
}
