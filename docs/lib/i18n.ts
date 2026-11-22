import { defineI18n } from 'fumadocs-core/i18n'

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'zh-TW'],
  // Static export has no middleware to rewrite URLs, so every locale keeps its prefix
  hideLocale: 'never',
  // button.mdx is English, button.zh-TW.mdx its translation; untranslated pages fall back to English
  parser: 'dot',
})

export type Lang = (typeof i18n.languages)[number]

export function isLang(value: string): value is Lang {
  return (i18n.languages as string[]).includes(value)
}

/**
 * Prefix a root-relative href with the current locale, so `/installation` written in MDX stays in
 * the reader's language. Hrefs that already carry a locale, external URLs and anchors pass through.
 */
export function localizeHref(href: string, lang: Lang): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href
  const first = href.split(/[/?#]/, 2)[1] ?? ''
  if (isLang(first)) return href
  return href === '/' ? `/${lang}` : `/${lang}${href}`
}
