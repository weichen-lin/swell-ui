import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { appName, githubUrl } from './shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          {/* Decorative: the name next to it is the accessible label */}
          <img src="/logo.svg" alt="" width={24} height={24} className="size-6" />
          {appName}
        </>
      ),
    },
    githubUrl,
  }
}
