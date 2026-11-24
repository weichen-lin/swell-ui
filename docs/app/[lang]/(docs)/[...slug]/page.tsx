import { Card } from 'fumadocs-ui/components/card'
import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from 'fumadocs-ui/layouts/docs/page'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ComponentProps } from 'react'
import { FileTextIcon } from '@/components/icons'
import { getMDXComponents } from '@/components/mdx'
import { docLabels } from '@/lib/doc-labels'
import { isLang, localizeHref } from '@/lib/i18n'
import { markdownUrl } from '@/lib/llms'
import { source } from '@/lib/source'

async function getPage(props: PageProps<'/[lang]/[...slug]'>) {
  const { lang, slug } = await props.params
  if (!isLang(lang)) notFound()
  const page = source.getPage(slug, lang)
  if (!page) notFound()
  return { lang, page }
}

export default async function Page(props: PageProps<'/[lang]/[...slug]'>) {
  const { lang, page } = await getPage(props)
  const MDX = page.data.body
  const DefaultLink = defaultMdxComponents.a

  // Relative file links resolve to the page in this locale (or its English fallback);
  // root-relative ones get the locale prefix, so links never drop the reader into another language
  const href = (value?: string) => value && localizeHref(source.resolveHref(value, page), lang)

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      {/* The page's .md (see app/md-export), for pasting into or pointing an AI agent at */}
      <div className="-mt-4 mb-2 flex flex-row flex-wrap items-center gap-2 border-b pb-6">
        {/* Its label comes from i18nUI, which also has the "copied" state */}
        <MarkdownCopyButton markdownUrl={markdownUrl(page)} />
        <a
          href={markdownUrl(page)}
          className={buttonVariants({
            variant: 'secondary',
            size: 'sm',
            className: 'gap-2 [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground',
          })}
        >
          <FileTextIcon />
          {docLabels[lang].viewMarkdown}
        </a>
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents(
            {
              a: (props) => <DefaultLink {...props} href={href(props.href)} />,
              Card: (props: ComponentProps<typeof Card>) => (
                <Card {...props} href={href(props.href)} />
              ),
            },
            lang,
          )}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  // Untranslated pages are part of every locale through the English fallback
  // /[lang]/ is a redirect to the introduction (app/[lang]/page.tsx), so a root index.mdx has no route
  return source
    .getPages(params.lang)
    .filter((page) => page.slugs.length > 0)
    .map((page) => ({ slug: page.slugs }))
}

export async function generateMetadata(props: PageProps<'/[lang]/[...slug]'>): Promise<Metadata> {
  const { page } = await getPage(props)
  return { title: page.data.title, description: page.data.description }
}
