'use client'
import { Combobox, type ComboboxOption } from '@weichenlin/swell-ui'
import { useEffect, useState } from 'react'

const catalog: ComboboxOption[] = [
  { value: 'payment-api', label: 'Payment API' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'admin', label: 'Admin console' },
  { value: 'edge-api', label: 'Edge API' },
]

export default function ComboboxAsync() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ComboboxOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      const text = query.trim().toLowerCase()
      setResults(catalog.filter((option) => option.label.toLowerCase().includes(text)))
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="w-full max-w-sm">
      <Combobox
        label="Project"
        placeholder="Type to search"
        options={results}
        filter={false}
        loading={loading}
        onInputValueChange={(text, details) => {
          if (details.reason === 'input') setQuery(text)
        }}
      />
    </div>
  )
}
