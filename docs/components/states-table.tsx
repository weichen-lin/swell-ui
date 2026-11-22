import { docLabels } from '@/lib/doc-labels'
import type { Lang } from '@/lib/i18n'
import { DocTable, inline } from './doc-table'

type StateRow = {
  state: string
  /** The data-* / aria-* the component renders, e.g. `aria-busy="true"`; code unless it has backticks */
  attribute: string
  notes?: string
}

/** What each state looks like in the DOM, so readers can style and test against it. */
export function StatesTable({ rows, lang = 'en' }: { rows: StateRow[]; lang?: Lang }) {
  const t = docLabels[lang]
  return (
    <DocTable
      head={[t.state, t.attribute, t.notes]}
      rows={rows.map((row) => [
        row.state,
        row.attribute.includes('`') ? (
          inline(row.attribute)
        ) : (
          <code key="attribute">{row.attribute}</code>
        ),
        row.notes ? inline(row.notes) : null,
      ])}
    />
  )
}
