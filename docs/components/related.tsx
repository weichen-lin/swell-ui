import { Card, Cards } from 'fumadocs-ui/components/card'
import { type Lang, localizeHref } from '@/lib/i18n'

type RelatedItem = {
  title: string
  /** Root-relative page, e.g. /components/tooltip; the locale prefix is added here */
  href: string
  description?: string
}

/** 1-3 cards to neighbouring components; more than three stops being a hint. */
export function Related({ items, lang = 'en' }: { items: RelatedItem[]; lang?: Lang }) {
  return (
    <Cards>
      {items.slice(0, 3).map((item) => (
        <Card
          key={item.href}
          title={item.title}
          description={item.description}
          href={localizeHref(item.href, lang)}
        />
      ))}
    </Cards>
  )
}
