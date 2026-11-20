import '@testing-library/jest-dom/vitest'

// jsdom's CSS.supports accepts anchor positioning but jsdom lays nothing out, so keep the floating
// layers on their measuring path. Tests of the anchored path mock CSS.supports themselves.
if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
  const supports = CSS.supports.bind(CSS) as (...args: string[]) => boolean
  CSS.supports = ((...args: string[]) =>
    !/anchor|position-(try|visibility)/.test(args.join(':')) &&
    supports(...args)) as typeof CSS.supports
}
