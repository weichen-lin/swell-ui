import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../button'
import { compactButton, FieldFrame, type FieldProps } from './field'

const RESET_MS = 1500

export type CopyInputProps = Omit<
  FieldProps,
  'type' | 'value' | 'defaultValue' | 'readOnly' | 'onChange'
> & {
  value: string
}

export function CopyInput({
  value,
  mono = true,
  size = 'md',
  onFocus,
  onClick,
  ...props
}: CopyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(value)
      setResult('copied')
    } catch {
      setResult('failed')
    }
    timer.current = setTimeout(() => setResult('idle'), RESET_MS)
  }

  return (
    <FieldFrame
      {...props}
      value={value}
      readOnly
      mono={mono}
      size={size}
      inputRef={inputRef}
      status={result === 'copied' ? 'Copied' : result === 'failed' ? 'Copy failed' : ''}
      onFocus={(e) => {
        e.currentTarget.select()
        onFocus?.(e)
      }}
      // Some browsers collapse the focus selection on mouseup
      onClick={(e) => {
        e.currentTarget.select()
        onClick?.(e)
      }}
      actions={
        props.disabled ? null : (
          <Button
            icon={result === 'copied' ? <Check /> : <Copy />}
            aria-label="Copy"
            intent="ghost"
            size={size}
            className={compactButton[size]}
            onClick={copy}
          />
        )
      }
    />
  )
}
