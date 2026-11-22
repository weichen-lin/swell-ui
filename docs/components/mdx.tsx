import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ComponentProps, ComponentType } from 'react'
import { AutoTypeTable } from '@/components/auto-type-table'
import { ComponentIndex } from '@/components/component-index'
import { ComponentPreview } from '@/components/component-preview'
import { KeyboardTable } from '@/components/keyboard-table'
import { Related } from '@/components/related'
import { StatesTable } from '@/components/states-table'
import { TokenList } from '@/components/token-list'
import { WhenToUse } from '@/components/when-to-use'
import type { Lang } from '@/lib/i18n'

// MDX never passes lang; the page knows it, so each localized block gets it bound here
function withLang<P extends { lang?: Lang }>(Component: ComponentType<P>, lang: Lang) {
  return function Localized(props: Omit<P, 'lang'>) {
    return <Component {...(props as P)} lang={lang} />
  }
}

export function getMDXComponents(components?: MDXComponents, lang: Lang = 'en') {
  return {
    ...defaultMdxComponents,
    AutoTypeTable,
    ComponentPreview: withLang<ComponentProps<typeof ComponentPreview>>(ComponentPreview, lang),
    ComponentIndex: withLang(ComponentIndex, lang),
    KeyboardTable: withLang(KeyboardTable, lang),
    Related: withLang(Related, lang),
    StatesTable: withLang(StatesTable, lang),
    TokenList: withLang(TokenList, lang),
    WhenToUse: withLang(WhenToUse, lang),
    ...components,
  } satisfies MDXComponents
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
