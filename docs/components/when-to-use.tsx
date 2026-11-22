import Link from 'fumadocs-core/link'
import { docLabels } from '@/lib/doc-labels'
import { type Lang, localizeHref } from '@/lib/i18n'
import { inline } from './doc-table'

type Alternative = {
  /** Component name shown as the link text */
  name: string
  /** Root-relative page, e.g. /components/switch; the locale prefix is added here */
  href: string
  /** When to reach for it instead */
  when: string
}

const card = 'rounded-xl border border-fd-border bg-fd-card p-4 text-sm text-fd-card-foreground'
const title = 'mt-0 mb-2 font-semibold text-fd-foreground'

/** Opening block of a component page: what it is for, and what to use instead. */
export function WhenToUse({
  use,
  alternatives = [],
  lang = 'en',
}: {
  use: string[]
  alternatives?: Alternative[]
  lang?: Lang
}) {
  const t = docLabels[lang]
  return (
    // not-prose: prose margins fight the card layout, so inline code is styled here instead
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-2 [&_code]:rounded [&_code]:bg-fd-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]">
      <section className={card}>
        <p className={title}>{t.whenToUse}</p>
        <ul className="m-0 list-disc space-y-1 ps-5">
          {use.map((item) => (
            <li key={item}>{inline(item)}</li>
          ))}
        </ul>
      </section>
      {alternatives.length > 0 && (
        <section className={card}>
          <p className={title}>{t.alternatives}</p>
          <ul className="m-0 list-disc space-y-1 ps-5">
            {alternatives.map((alt) => (
              <li key={alt.name}>
                <Link
                  href={localizeHref(alt.href, lang)}
                  className="font-medium text-fd-foreground underline decoration-fd-primary/40 underline-offset-2 hover:decoration-fd-primary"
                >
                  {alt.name}
                </Link>
                {': '}
                {inline(alt.when)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
