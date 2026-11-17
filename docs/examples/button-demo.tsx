'use client'
import { Button, toast } from '@weichenlin/swell-ui'

export default function ButtonDemo() {
  return <Button onClick={() => toast.success('Saved')}>Save</Button>
}
