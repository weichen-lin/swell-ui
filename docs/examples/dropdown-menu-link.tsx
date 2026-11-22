'use client'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@weichenlin/swell-ui'

export default function DropdownMenuLink() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button intent="secondary">Help</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <a href="#docs">Documentation</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="#support">Contact support</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
