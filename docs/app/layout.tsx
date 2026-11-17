import type { Metadata } from 'next'
import { Provider } from '@/components/provider'
import { appName, siteUrl } from '@/lib/shared'
import './global.css'

export const metadata: Metadata = {
  // Resolves relative metadata URLs (icons, canonical) against the deployed site
  metadataBase: new URL(siteUrl),
  title: { default: appName, template: `%s | ${appName}` },
  description: 'Hand-built React 19 components styled with Tailwind CSS v4.',
}

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
