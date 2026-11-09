import { Eye, EyeOff } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../button'
import { compactButton, FieldFrame, type FieldProps } from './field'

export type PasswordInputProps = Omit<FieldProps, 'type'> & {
  type?: never
}

export function PasswordInput({
  autoComplete = 'current-password',
  size = 'md',
  ...props
}: PasswordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [visible, setVisible] = useState(false)

  return (
    <FieldFrame
      {...props}
      size={size}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      inputRef={inputRef}
      actions={
        props.disabled ? null : (
          // Stable name + aria-pressed: changing the label would make the state ambiguous to AT
          <Button
            icon={visible ? <EyeOff /> : <Eye />}
            aria-label="Show password"
            aria-pressed={visible}
            intent="ghost"
            size={size}
            className={compactButton[size]}
            // Keep focus (and the caret) in the input
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setVisible((v) => !v)}
          />
        )
      }
    />
  )
}
