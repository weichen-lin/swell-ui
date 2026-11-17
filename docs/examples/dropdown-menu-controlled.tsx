'use client'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function DropdownMenuControlled() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('Nothing selected')
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button intent="secondary">Sort by</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setMessage('Sorted by name')}>Name</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMessage('Sorted by date')}>Date</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setMessage('Menu stayed open')
            }}
          >
            Keep menu open
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="text-sm">
        {message} ({open ? 'open' : 'closed'})
      </span>
    </div>
  )
}
