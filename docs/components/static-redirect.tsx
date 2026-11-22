// Static export has no server redirects: meta refresh, with a script that also keeps ?query#hash
export function StaticRedirect({ to }: { to: string }) {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${to}`} />
      <link rel="canonical" href={to} />
      <script
        dangerouslySetInnerHTML={{
          __html: `location.replace(${JSON.stringify(to)} + location.search + location.hash)`,
        }}
      />
      <a href={to}>Continue to the documentation</a>
    </>
  )
}
