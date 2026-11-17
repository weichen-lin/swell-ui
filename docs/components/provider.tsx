'use client'
import { Toaster } from '@weichenlin/swell-ui'
import { RootProvider } from 'fumadocs-ui/provider/next'
import type { ReactNode } from 'react'
import SearchDialog from '@/components/search'

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      // Fumadocs styles key off `.dark`; swell-ui tokens key off data-theme. Write both.
      theme={{ attribute: ['class', 'data-theme'] }}
    >
      {children}
      {/* One Toaster for the whole site, so demos that call toast() never stack duplicates */}
      <Toaster />
    </RootProvider>
  )
}
