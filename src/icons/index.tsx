/**
 * @license
 * Icon path data copied from the Lucide icon set, version 1.70.0.
 *
 * ISC License
 *
 * Copyright (c) 2026 Lucide Icons and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * arrow-down, arrow-up, check, chevron-down, chevron-left, chevron-right, circle-alert
 * (alert-circle), circle-x (x-circle), info, moon, search, triangle-alert (alert-triangle) and x
 * are derived from Feather: MIT License, Copyright (c) 2013-present Cole Bemis. Full texts of both
 * licenses are in src/icons/LICENSE, which the package ships as dist/ICONS-LICENSE.
 */
import type { ComponentProps, ReactNode } from 'react'

// Internal icons: the components' built-in defaults, not part of the public API. Each renders the
// upstream default SVG (24px box, 2px round stroke in currentColor), hidden from assistive tech.
// `data-icon` names the icon so tests can tell a default from a custom one.
export function createIcon(name: string, paths: ReactNode) {
  function Icon(props: ComponentProps<'svg'>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        data-icon={name}
        {...props}
      >
        {paths}
      </svg>
    )
  }
  return Icon
}

export const ArrowDownIcon = createIcon(
  'arrow-down',
  <>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </>,
)

export const ArrowUpIcon = createIcon(
  'arrow-up',
  <>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </>,
)

export const ArrowUpDownIcon = createIcon(
  'arrow-up-down',
  <>
    <path d="m21 16-4 4-4-4" />
    <path d="M17 20V4" />
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
  </>,
)

export const CheckIcon = createIcon('check', <path d="M20 6 9 17l-5-5" />)

export const ChevronDownIcon = createIcon('chevron-down', <path d="m6 9 6 6 6-6" />)

export const ChevronLeftIcon = createIcon('chevron-left', <path d="m15 18-6-6 6-6" />)

export const ChevronRightIcon = createIcon('chevron-right', <path d="m9 18 6-6-6-6" />)

export const CircleAlertIcon = createIcon(
  'circle-alert',
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </>,
)

export const CircleCheckIcon = createIcon(
  'circle-check',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m16 9-5.5 5.5L8 12" />
  </>,
)

export const CircleDashedIcon = createIcon(
  'circle-dashed',
  <>
    <path d="M10.1 2.182a10 10 0 0 1 3.8 0" />
    <path d="M13.9 21.818a10 10 0 0 1-3.8 0" />
    <path d="M17.609 3.721a10 10 0 0 1 2.69 2.7" />
    <path d="M2.182 13.9a10 10 0 0 1 0-3.8" />
    <path d="M20.279 17.609a10 10 0 0 1-2.7 2.69" />
    <path d="M21.818 10.1a10 10 0 0 1 0 3.8" />
    <path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" />
    <path d="M6.391 20.279a10 10 0 0 1-2.69-2.7" />
  </>,
)

export const CircleXIcon = createIcon(
  'circle-x',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </>,
)

export const CopyIcon = createIcon(
  'copy',
  <>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>,
)

export const EyeIcon = createIcon(
  'eye',
  <>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </>,
)

export const EyeOffIcon = createIcon(
  'eye-off',
  <>
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
    <path d="m2 2 20 20" />
  </>,
)

export const InfoIcon = createIcon(
  'info',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </>,
)

export const LoaderCircleIcon = createIcon(
  'loader-circle',
  <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
)

export const MenuIcon = createIcon(
  'menu',
  <>
    <path d="M4 5h16" />
    <path d="M4 12h16" />
    <path d="M4 19h16" />
  </>,
)

export const MoonIcon = createIcon(
  'moon',
  <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />,
)

export const SearchIcon = createIcon(
  'search',
  <>
    <path d="m21 21-4.34-4.34" />
    <circle cx="11" cy="11" r="8" />
  </>,
)

export const SunIcon = createIcon(
  'sun',
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </>,
)

export const TriangleAlertIcon = createIcon(
  'triangle-alert',
  <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>,
)

export const XIcon = createIcon(
  'x',
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
)
