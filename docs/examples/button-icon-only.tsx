'use client'
import { Button } from '@weichenlin/swell-ui'
import { Copy, Pencil, Trash2 } from 'lucide-react'

export default function ButtonIconOnly() {
  return (
    <div className="flex gap-2">
      <Button intent="secondary" icon={<Pencil />} aria-label="Edit" />
      <Button intent="ghost" icon={<Copy />} aria-label="Copy link" />
      <Button intent="ghost" tone="danger" icon={<Trash2 />} aria-label="Delete" />
    </div>
  )
}
