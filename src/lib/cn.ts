import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Keep in sync with the @theme block in styles/theme.css (cn.test.ts checks it)
const tone = (name: string) => [
  name,
  `${name}-fg`,
  `${name}-subtle-bg`,
  `${name}-subtle-fg`,
  `${name}-border`,
]

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'bg',
        'surface',
        'surface-raised',
        'surface-muted',
        'surface-inset',
        'fg',
        'fg-strong',
        'fg-muted',
        'fg-subtle',
        'border',
        'border-strong',
        'ring',
        'ring-deep',
        'primary',
        'primary-fg',
        'primary-pressed',
        'accent',
        'inverse',
        'inverse-fg',
        'inverse-hover',
        'inverse-pressed',
        'danger-pressed',
        'danger-inset',
        'focus',
        'input-bg',
        'input-bg-hover',
        'input-border',
        'input-border-hover',
        'input-placeholder',
        'input-focus',
        'input-highlight',
        'input-halo',
        'input-halo-invalid',
        'input-halo-invalid-focus',
        'control-checked',
        'control-checked-fg',
        'switch-handle',
        'switch-handle-checked',
        'popover-bg',
        'popover-border',
        'popover-highlight',
        'dialog-backdrop',
        ...['success', 'warning', 'danger', 'info', 'neutral'].flatMap(tone),
      ],
      shadow: [
        'input',
        'input-lift',
        'switch-thumb',
        'popover',
        'dialog',
        'whisper',
        'pressed',
        'raised',
        'lift',
        'lift-hover',
      ],
      radius: ['control', 'surface', 'item', 'inset'],
      spacing: ['control-sm', 'control-md', 'control-lg'],
      container: ['page'],
      font: ['sans', 'serif', 'mono'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
