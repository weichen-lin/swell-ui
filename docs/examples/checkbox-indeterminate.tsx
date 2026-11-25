'use client'
import {
  Checkbox,
  CheckboxGroup,
  CheckboxGroupLabel,
  CheckboxGroupItems,
} from '@weichenlin/swell-ui'
import { useState } from 'react'

const options = ['Email', 'SMS', 'Push']

export default function CheckboxIndeterminate() {
  const [selected, setSelected] = useState<string[]>(['Email'])
  const all = selected.length === options.length
  const some = selected.length > 0 && !all

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Checkbox
        label="All channels"
        checked={all}
        indeterminate={some}
        onChange={(event) => setSelected(event.currentTarget.checked ? options : [])}
      />
      <div className="ps-6">
        <CheckboxGroup>
          <CheckboxGroupLabel>Channels</CheckboxGroupLabel>
          <CheckboxGroupItems>
            {options.map((option) => (
              <Checkbox
                key={option}
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
          </CheckboxGroupItems>
        </CheckboxGroup>
      </div>
    </div>
  )
}
