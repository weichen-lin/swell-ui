'use client'
import { Button } from '@weichenlin/swell-ui'
import { ExternalLink } from 'lucide-react'

export default function ButtonLink() {
  return (
    // Same with a router's Link: it becomes the host element
    <Button asChild intent="secondary" iconRight={<ExternalLink />}>
      <a href="https://github.com/weichen-lin/swell-ui" target="_blank" rel="noreferrer">
        View on GitHub
      </a>
    </Button>
  )
}
