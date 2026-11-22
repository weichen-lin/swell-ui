import { notFound } from 'next/navigation'
import { StaticRedirect } from '@/components/static-redirect'
import { isLang } from '@/lib/i18n'

// No landing page: /<lang>/ opens the docs at the introduction
export default async function Page({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <StaticRedirect to={`/${lang}/introduction/`} />
}
