import { docLabels } from '@/lib/doc-labels'
import type { Lang } from '@/lib/i18n'
import { DocTable, inline } from './doc-table'

type Token = {
  /** Custom property name, with the leading dashes */
  name: string
  description: string
}

/** The CSS custom properties a component reads, i.e. what a theme can override. */
export function TokenList({ tokens, lang = 'en' }: { tokens: Token[]; lang?: Lang }) {
  const t = docLabels[lang]
  return (
    <DocTable
      head={[t.token, t.description]}
      rows={tokens.map((token) => [
        <code key="name" className="whitespace-nowrap">
          {token.name}
        </code>,
        inline(token.description),
      ])}
    />
  )
}
