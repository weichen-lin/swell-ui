'use client'
import { SearchInput } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function InputSearch() {
  const [query, setQuery] = useState('')
  return (
    <div className="w-full max-w-sm">
      <SearchInput
        aria-label="Search projects"
        placeholder="Search projects"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onClear={() => setQuery('')}
      />
    </div>
  )
}
