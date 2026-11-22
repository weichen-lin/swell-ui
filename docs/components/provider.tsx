'use client'
import { Toaster } from '@weichenlin/swell-ui'
import type { I18nProviderProps } from 'fumadocs-ui/contexts/i18n'
import { RootProvider } from 'fumadocs-ui/provider/next'
import type { ReactNode } from 'react'
import SearchDialog from '@/components/search'

export function Provider({
  i18n,
  children,
}: {
  i18n: Omit<I18nProviderProps, 'children'>
  children: ReactNode
}) {
  return (
    <RootProvider
      i18n={i18n}
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
