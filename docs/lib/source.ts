import { loader } from 'fumadocs-core/source'
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema'
import { defineDocs } from 'fumadocs-mdx/macro'
import { i18n } from './i18n'
import { docsRoute } from './shared'

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    // Exports each page as a Markdown component for the .md files and llms-full.txt; custom MDX
    // components get their Markdown form from lib/llms.tsx. Fumadocs' `[#id]` heading suffix is
    // noise to an agent, so it is left out.
    postprocess: { includeProcessedMarkdown: { headingIds: false } },
  },
  meta: { schema: metaSchema },
})

// https://fumadocs.dev/docs/headless/source-api
export const source = loader({
  baseUrl: docsRoute,
  i18n,
  source: docs.toFumadocsSource(),
})
