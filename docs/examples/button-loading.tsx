'use client'
import { Button } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function ButtonLoading() {
  const [deploying, setDeploying] = useState(false)

  function deploy() {
    setDeploying(true)
    setTimeout(() => setDeploying(false), 2000)
  }

  return (
    <Button loading={deploying} loadingText="Deploying" onClick={deploy}>
      Deploy
    </Button>
  )
}
