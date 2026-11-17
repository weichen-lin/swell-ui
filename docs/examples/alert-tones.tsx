'use client'
import { Alert } from '@weichenlin/swell-ui'

export default function AlertTones() {
  return (
    <div className="grid w-full gap-3">
      <Alert>Order sync runs every 30 minutes.</Alert>
      <Alert tone="info" title="Next sync at 11:00" />
      <Alert tone="success" title="Orders are up to date" />
      <Alert tone="warning" title="Order sync is off">
        Turn it on in settings to import new orders automatically.
      </Alert>
      <Alert tone="danger" title="Couldn’t load the latest orders">
        The list still shows data from 10:42.
      </Alert>
    </div>
  )
}
