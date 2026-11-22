import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Provider } from '@/components/provider'
import { i18n, isLang } from '@/lib/i18n'
import { i18nUI } from '@/lib/i18n-ui'
import { appName, siteUrl } from '@/lib/shared'
import '../global.css'

export const metadata: Metadata = {
  // Resolves relative metadata URLs (icons, canonical) against the deployed site
  metadataBase: new URL(siteUrl),
  title: { default: appName, template: `%s | ${appName}` },
  description: 'Hand-built React 19 components styled with Tailwind CSS v4.',
}

// Root layout per locale, so <html lang> matches the page language in the static HTML
export default async function Layout({ params, children }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider i18n={i18nUI.provider(lang)}>{children}</Provider>
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return i18n.languages.map((lang) => ({ lang }))
}
