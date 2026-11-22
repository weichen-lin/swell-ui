import { notFound } from 'next/navigation'
import { isLang } from '@/lib/i18n'
import { getPageMarkdown, markdownPages } from '@/lib/llms'

export const revalidate = false

// Static export has no rewrites, so a page's Markdown can't be served from /en/x.md directly:
// it is exported under /md-export/ and scripts/markdown-files.mjs moves it next to x/index.html.
export async function GET(
  _request: Request,
  { params }: RouteContext<'/md-export/[lang]/[...slug]'>,
) {
  const { lang, slug } = await params
  // The last segment carries the extension, so the exported file is already named x.md
  const slugs = [...slug.slice(0, -1), slug[slug.length - 1].replace(/\.md$/, '')]
  const text = isLang(lang) ? await getPageMarkdown(slugs, lang) : undefined
  if (text === undefined) notFound()
  return new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}

export function generateStaticParams() {
  return markdownPages().map(({ lang, slugs }) => ({
    lang,
    slug: [...slugs.slice(0, -1), `${slugs[slugs.length - 1]}.md`],
  }))
}
