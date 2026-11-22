import { FieldFrame, type FieldLabelProps, type FieldProps } from './field'

/**
 * Password and search have dedicated components (PasswordInput, SearchInput).
 * No `number`: its spinners and wheel stepping misfire; use `inputMode="numeric"` instead.
 */
export type InputType = 'text' | 'email' | 'url' | 'tel'

export type InputProps = Omit<FieldProps, 'type' | 'label' | 'floating'> &
  FieldLabelProps & {
    /**
     * Input type. There is no `number`; use `inputMode="numeric"` instead.
     * @defaultValue 'text'
     */
    type?: InputType
  }

export function Input({ type = 'text', ...props }: InputProps) {
  return <FieldFrame {...props} type={type} />
}
