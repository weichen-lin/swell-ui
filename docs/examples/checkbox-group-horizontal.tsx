'use client'
import { Checkbox, CheckboxGroup } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function CheckboxGroupHorizontal() {
  const [selected, setSelected] = useState<string[]>([])
  const error = selected.length === 0 ? 'Pick at least one' : undefined

  return (
    <CheckboxGroup legend="Notify me by" orientation="horizontal" error={error}>
      {['Email', 'SMS', 'Push'].map((option) => (
        <Checkbox
          key={option}
          name="channels"
          value={option}
          label={option}
          checked={selected.includes(option)}
          onChange={(event) =>
            setSelected((current) =>
              event.currentTarget.checked
                ? [...current, option]
                : current.filter((item) => item !== option),
            )
          }
        />
      ))}
    </CheckboxGroup>
  )
}
