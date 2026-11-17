import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  // Pure static site: `next build` writes plain HTML/JS/CSS to out/, no Node server needed
  output: 'export',
  // /components/button/ -> components/button/index.html, served by any directory-index host
  trailingSlash: true,
  // Image optimization needs a server
  images: { unoptimized: true },
  reactStrictMode: true,
}

export default withMDX(config)
