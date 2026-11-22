import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import type { Lang } from './i18n'
import { appName, githubUrl } from './shared'

export function baseOptions(lang: Lang): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {/* Decorative: the name next to it is the accessible label */}
          <img src="/logo.svg" alt="" width={24} height={24} className="size-6" />
          {appName}
        </>
      ),
      // The docs start page in the reader's language; /<lang>/ itself only redirects here
      url: `/${lang}/introduction/`,
    },
    githubUrl,
  }
}
