import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { notFound } from 'next/navigation'
import { isLang } from '@/lib/i18n'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'

export default async function Layout({ params, children }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  return (
    <DocsLayout tree={source.getPageTree(lang)} {...baseOptions(lang)}>
      {children}
    </DocsLayout>
  )
}
