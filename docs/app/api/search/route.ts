import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

export const revalidate = false

// staticGET: the index is written to out/api/search at build time and searched in the browser.
// With i18n on the loader, pages are tagged by locale and filtered on the client. The default
// `multilingual` tokenizer splits words with Intl.Segmenter, so Chinese needs no extra tokenizer.
export const { staticGET: GET } = createFromSource(source)
