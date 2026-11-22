import { StaticRedirect } from '@/components/static-redirect'
import { i18n } from '@/lib/i18n'

// Straight to the first docs page, skipping the /en/ hop
export default function Page() {
  return <StaticRedirect to={`/${i18n.defaultLanguage}/introduction/`} />
}
