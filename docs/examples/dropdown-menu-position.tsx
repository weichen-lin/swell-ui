'use client'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@weichenlin/swell-ui'

export default function DropdownMenuPosition() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="secondary">Open to the right</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={8}>
        <DropdownMenuItem>First</DropdownMenuItem>
        <DropdownMenuItem>Second</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
