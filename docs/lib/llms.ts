import { markdownTable } from 'fumadocs-core/mdx-plugins/stringifier'
import type { Node as PageTreeNode } from 'fumadocs-core/page-tree'
import { asMarkdown, md } from 'fumadocs-core/server'
import type { InferPageType } from 'fumadocs-core/source'
import type { DocEntry } from 'fumadocs-typescript'
import type { ReactNode } from 'react'
import { type AutoTypeTable, generateTypeDocs } from '@/components/auto-type-table'
import { getGroups } from '@/components/component-index'
import type { KeyboardTable } from '@/components/keyboard-table'
import type { Related } from '@/components/related'
import type { StatesTable } from '@/components/states-table'
import type { TokenList } from '@/components/token-list'
import type { WhenToUse } from '@/components/when-to-use'
import type { ExampleName } from '@/examples'
import { docLabels } from './doc-labels'
import { readExampleSource } from './example-source'
import { i18n, type Lang, localizeHref } from './i18n'
import { appName, siteUrl } from './shared'
import { source } from './source'

type Page = InferPageType<typeof source>
// MDX authors never pass lang; the Markdown components close over it instead
type Props<C extends (props: never) => unknown> = Omit<Parameters<C>[0], 'lang'>

/** Where the .md of a page is served: next to its index.html, `button/` -> `button.md`. */
export function markdownUrl(page: Page) {
  return `${page.url.replace(/\/$/, '')}.md`
}

/**
 * A root-relative docs href as an absolute link for agents: in the reader's locale, and to the
 * page's .md when it is a docs page. Absolute, since pasted Markdown has no base URL.
 */
function agentHref(href: string, lang: Lang) {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  const localized = localizeHref(href, lang)
  const [path, hash = ''] = localized.split('#')
  const page = source.getPageByUrl(path.replace(/(.)\/$/, '$1'), lang)
  return `${siteUrl}${page ? markdownUrl(page) : localized}${hash && `#${hash}`}`
}

// Page-tree names and MDX props are ReactNode in type, plain text in this content
const plain = (node: ReactNode) =>
  typeof node === 'string' || typeof node === 'number' ? String(node) : ''
const block = (text: string) => `\n\n${text.trim()}\n\n`
const code = (text: string) => (text.includes('`') ? `\`\` ${text} \`\`` : `\`${text}\``)
const link = (title: string, href: string, lang: Lang, description?: ReactNode) =>
  `- [${title}](${agentHref(href, lang)})${description ? `: ${plain(description)}` : ''}`

// MDX string props already write inline code as `backticks`, so they pass through as Markdown.
// Each component calls asMarkdown() to opt in; renderToMarkdown keeps any other one as JSX.
function markdownComponents(lang: Lang) {
  const t = docLabels[lang]
  return {
    async ComponentPreview({ name }: { name: ExampleName }) {
      asMarkdown()
      // The demo itself can't be read as text; its source is what an agent can reuse
      return block(`\`\`\`tsx\n${await readExampleSource(name)}\n\`\`\``)
    },
    async AutoTypeTable(props: Props<typeof AutoTypeTable>) {
      asMarkdown()
      const docs = await generateTypeDocs(props)
      return docs.map((doc) => block(typeTable(doc.entries))).join('')
    },
    StatesTable({ rows }: Props<typeof StatesTable>) {
      asMarkdown()
      return block(
        markdownTable([
          [t.state, t.attribute, t.notes],
          ...rows.map((row) => [
            row.state,
            // Same rule as the HTML table: code unless the value brings its own backticks
            row.attribute.includes('`') ? row.attribute : code(row.attribute),
            row.notes ?? '',
          ]),
        ]),
      )
    },
    KeyboardTable({ rows }: Props<typeof KeyboardTable>) {
      asMarkdown()
      const combo = (keys: string) => keys.split('+').map(code).join(' + ')
      return block(
        markdownTable([
          [t.key, t.action],
          ...rows.map((row) => [[row.keys].flat().map(combo).join(' / '), row.action]),
        ]),
      )
    },
    TokenList({ tokens }: Props<typeof TokenList>) {
      asMarkdown()
      return block(
        markdownTable([
          [t.token, t.description],
          ...tokens.map((token) => [code(token.name), token.description]),
        ]),
      )
    },
    WhenToUse({ use, alternatives = [] }: Props<typeof WhenToUse>) {
      asMarkdown()
      let out = `**${t.whenToUse}**\n\n${use.map((item) => `- ${item}`).join('\n')}`
      if (alternatives.length > 0)
        out += `\n\n**${t.alternatives}**\n\n${alternatives
          .map((alt) => link(alt.name, alt.href, lang, alt.when))
          .join('\n')}`
      return block(out)
    },
    Related({ items }: Props<typeof Related>) {
      asMarkdown()
      // Same cap as the cards
      return block(
        items
          .slice(0, 3)
          .map((item) => link(item.title, item.href, lang, item.description))
          .join('\n'),
      )
    },
    ComponentIndex() {
      asMarkdown()
      return block(
        getGroups(lang)
          .map((group) => {
            const items = group.items.map((item) => {
              const page = source.getNodePage(item, lang)
              return link(
                page?.data.title ?? plain(item.name),
                item.url,
                lang,
                page?.data.description,
              )
            })
            return group.title ? `## ${plain(group.title)}\n\n${items.join('\n')}` : items
          })
          .flat()
          .join('\n\n'),
      )
    },
    async Cards({ children }: { children?: ReactNode }) {
      asMarkdown()
      // Children arrive with the source's indentation and blank lines; one tight list instead
      const text = await md`${children}`
      return block(text.replace(/^[ \t]+/gm, '').replace(/\n{2,}/g, '\n'))
    },
    Card({ title, href, description }: { title: string; href?: string; description?: string }) {
      asMarkdown()
      return `${href ? link(title, href, lang, description) : `- ${title}`}\n`
    },
  }
}

/** Default value from the `@default` / `@defaultValue` JSDoc tag, as the HTML table reads it. */
function defaultOf(entry: DocEntry) {
  return entry.tags.find((tag) => tag.name === 'default' || tag.name === 'defaultValue')?.text
}

// Fumadocs' short forms for types it doesn't spell out. The HTML table expands them on click; an
// agent can't, so it gets the full type instead.
const placeholderType = /^(union|object|function|array|tuple)$/

function typeTable(entries: DocEntry[]) {
  return markdownTable([
    ['Prop', 'Type', 'Default', 'Description'],
    ...entries.map((entry) => {
      const fallback = defaultOf(entry)
      const description = entry.description.replace(/{@link (?<link>[^}]*)}/g, '$1')
      return [
        code(`${entry.name}${entry.required ? '' : '?'}`),
        code(
          placeholderType.test(entry.simplifiedType)
            ? entry.type.replace(/ \| undefined$/, '')
            : entry.simplifiedType,
        ),
        fallback ? code(fallback) : '-',
        entry.deprecated ? `**Deprecated.** ${description}` : description,
      ]
    }),
  ])
}

/** Root-relative links in authored Markdown, outside fenced code. */
function rewriteLinks(text: string, lang: Lang) {
  return text
    .split(/(^```[\s\S]*?^```)/m)
    .map((part, i) =>
      // Odd indexes are the captured code fences
      i % 2 ? part : part.replace(/\]\((\/[^)\s]*)\)/g, (_, href) => `](${agentHref(href, lang)})`),
    )
    .join('')
}

/** One docs page as Markdown: title, description, then the body with every MDX block as text. */
export async function getPageMarkdown(slugs: string[], lang: Lang) {
  const page = source.getPage(slugs, {
    language: lang,
    props: { components: markdownComponents(lang) },
  })
  if (!page) return
  const body = rewriteLinks(await page.data.getText('processed'), lang)
  const head = [`# ${page.data.title}`, page.data.description && `> ${page.data.description}`]
  return `${head.filter(Boolean).join('\n\n')}\n\n${body.trim()}\n`
}

type Section = { title: string | undefined; pages: Page[] }

/** The sidebar of a locale: its pages in order, split at each separator. */
function sidebarSections(lang: Lang): Section[] {
  const sections: Section[] = [{ title: undefined, pages: [] }]
  const visit = (nodes: PageTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === 'separator') sections.push({ title: plain(node.name), pages: [] })
      else if (node.type === 'page') {
        const page = source.getNodePage(node, lang)
        if (page) sections[sections.length - 1].pages.push(page)
      } else {
        if (node.index) visit([node.index])
        visit(node.children)
      }
    }
  }
  visit(source.getPageTree(lang).children)
  return sections.filter((section) => section.pages.length > 0)
}

/** Every page of every locale with a docs route (/<lang>/ itself only redirects). */
export function markdownPages() {
  return i18n.languages.flatMap((lang) =>
    source
      .getPages(lang)
      .filter((page) => page.slugs.length > 0)
      .map((page) => ({ lang, slugs: page.slugs })),
  )
}

/** llms.txt (https://llmstxt.org): the English pages by sidebar group, then where zh-TW lives. */
export function getLLMsIndex() {
  const lang = i18n.defaultLanguage
  const entry = (page: Page) =>
    `- [${page.data.title}](${siteUrl}${markdownUrl(page)})${page.data.description ? `: ${page.data.description}` : ''}`
  const sections = sidebarSections(lang).map(
    (section) => `## ${section.title ?? 'Overview'}\n\n${section.pages.map(entry).join('\n')}`,
  )
  const zhTW = source.getPages('zh-TW').filter((page) => page.slugs.length > 0)

  return `# ${appName}

> Hand-built React 19 components styled with Tailwind CSS v4, published as \`@weichenlin/swell-ui\`. Your app compiles the CSS with its own Tailwind, so the design tokens become your utilities too.

Each link below is the Markdown version of a docs page; drop the \`.md\` for the HTML page. All English pages in one file: ${siteUrl}/llms-full.txt

## Installation

Peer dependencies: \`react\` and \`react-dom\` 19, \`tailwindcss\` 4.3+. No icon package: the built-in icons are inline SVG and each one can be swapped through a prop. The entry is marked \`'use client'\`, so Next.js Server Components can import it directly.

\`\`\`sh
pnpm add @weichenlin/swell-ui
\`\`\`

In the CSS file that imports Tailwind:

\`\`\`css
@import 'tailwindcss';
@import '@weichenlin/swell-ui/styles.css';
\`\`\`

${sections.join('\n\n')}

## Traditional Chinese (zh-TW)

Every page also has a zh-TW version: swap the \`/en/\` prefix for \`/zh-TW/\`, e.g. ${siteUrl}/zh-TW/components/button.md (${zhTW.length} pages). Start at:

${['/zh-TW/introduction', '/zh-TW/components']
  .map((url) => source.getPageByUrl(url, 'zh-TW'))
  .filter((page) => page !== undefined)
  .map(entry)
  .join('\n')}
`
}

/** llms-full.txt: every English page's Markdown, in sidebar order. */
export async function getLLMsFull() {
  const lang = i18n.defaultLanguage
  const pages = sidebarSections(lang).flatMap((section) => section.pages)
  const texts = await Promise.all(pages.map((page) => getPageMarkdown(page.slugs, lang)))
  return texts.join('\n\n')
}
