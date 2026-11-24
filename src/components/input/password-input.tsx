import { type ReactNode, useRef, useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../../icons'
import { iconOr } from '../../lib/icon-slots'
import { Button } from '../button'
import { compactButton, FieldFrame, type FieldProps } from './field'

export type PasswordInputProps = Omit<FieldProps, 'type'> & {
  /**
   * Icon of the reveal button while the password is hidden, sized to the button's icon size.
   * Defaults to an eye.
   */
  showIcon?: ReactNode
  /** Icon of the reveal button while the password is shown. Defaults to a crossed-out eye. */
  hideIcon?: ReactNode
  type?: never
}

export function PasswordInput({
  autoComplete = 'current-password',
  showIcon,
  hideIcon,
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
            icon={visible ? iconOr(hideIcon, <EyeOffIcon />) : iconOr(showIcon, <EyeIcon />)}
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
