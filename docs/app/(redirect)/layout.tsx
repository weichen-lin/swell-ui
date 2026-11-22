import type { ReactNode } from 'react'

// Separate root layout: the locale layouts own <html lang>, this one only serves the / redirect
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
