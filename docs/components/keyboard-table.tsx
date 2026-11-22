import { Fragment } from 'react'
import { docLabels } from '@/lib/doc-labels'
import type { Lang } from '@/lib/i18n'
import { DocTable, inline } from './doc-table'

type KeyRow = {
  /** One key or combo ('Shift+Tab'); an array lists alternatives that do the same thing */
  keys: string | string[]
  action: string
}

function Combo({ combo }: { combo: string }) {
  return combo.split('+').map((key, i) => (
    <Fragment key={key}>
      {i > 0 && ' + '}
      <kbd className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-xs text-fd-foreground">
        {key}
      </kbd>
    </Fragment>
  ))
}

export function KeyboardTable({ rows, lang = 'en' }: { rows: KeyRow[]; lang?: Lang }) {
  const t = docLabels[lang]
  return (
    <DocTable
      head={[t.key, t.action]}
      rows={rows.map((row) => [
        <span key="keys" className="whitespace-nowrap">
          {[row.keys].flat().map((combo, i) => (
            <Fragment key={combo}>
              {i > 0 && ' / '}
              <Combo combo={combo} />
            </Fragment>
          ))}
        </span>,
        inline(row.action),
      ])}
    />
  )
}
