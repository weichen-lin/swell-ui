import type { Node as PageTreeNode } from 'fumadocs-core/page-tree'
import { Card, Cards } from 'fumadocs-ui/components/card'
import { type Lang, localizeHref } from '@/lib/i18n'
import { source } from '@/lib/source'

type Group = { title: React.ReactNode; items: Extract<PageTreeNode, { type: 'page' }>[] }

const COMPONENTS_PATH = 'components'

/** Splits the page tree under /components into groups, one per separator. */
export function getGroups(lang: Lang): Group[] {
  const indexUrl = `/${lang}/${COMPONENTS_PATH}`
  let nodes: PageTreeNode[] = []

  const visit = (list: PageTreeNode[]): boolean => {
    const at = list.findIndex((n) => n.type === 'page' && n.url === indexUrl)
    if (at !== -1) {
      // components/meta.json is spread into its parent, so the groups follow the index page
      nodes = list.slice(at + 1)
      return true
    }
    for (const node of list) {
      if (node.type !== 'folder') continue
      if (node.index?.url === indexUrl) {
        nodes = node.children
        return true
      }
      if (visit(node.children)) return true
    }
    return false
  }
  visit(source.getPageTree(lang).children)

  const groups: Group[] = []
  for (const node of nodes) {
    if (node.type === 'separator') groups.push({ title: node.name, items: [] })
    else if (node.type === 'page' && node.url !== indexUrl) {
      // Pages listed before the first separator still show up, under no heading
      if (groups.length === 0) groups.push({ title: null, items: [] })
      groups[groups.length - 1].items.push(node)
    }
  }
  return groups.filter((group) => group.items.length > 0)
}

/** Every component page, grouped by the separators in components/meta.json; no list to maintain. */
export function ComponentIndex({ lang = 'en' }: { lang?: Lang }) {
  return (
    <div className="not-prose flex flex-col gap-10">
      {getGroups(lang).map((group, i) => (
        <section key={i} className="flex flex-col gap-3">
          <h2 className="flex items-baseline gap-2 text-lg font-semibold text-fd-foreground">
            {group.title}
            <span className="text-sm font-normal text-fd-muted-foreground">
              {group.items.length}
            </span>
          </h2>
          <Cards>
            {group.items.map((item) => (
              <Card
                key={item.url}
                title={item.name}
                description={item.description}
                href={localizeHref(item.url, lang)}
              />
            ))}
          </Cards>
        </section>
      ))}
    </div>
  )
}
