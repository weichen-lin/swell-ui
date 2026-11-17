import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/source'

export const revalidate = false

// staticGET: the index is written to out/api/search at build time and searched in the browser
export const { staticGET: GET } = createFromSource(source, { language: 'english' })
