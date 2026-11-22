'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@weichenlin/swell-ui'
import { useState } from 'react'

export default function AccordionControlled() {
  const [value, setValue] = useState<string | null>('project')
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Accordion value={value} onValueChange={setValue} collapsible={false}>
        <AccordionItem value="project">
          <AccordionTrigger>Project</AccordionTrigger>
          <AccordionContent>Project settings</AccordionContent>
        </AccordionItem>
        <AccordionItem value="members">
          <AccordionTrigger>Members</AccordionTrigger>
          <AccordionContent>Member settings</AccordionContent>
        </AccordionItem>
      </Accordion>
      <p className="text-sm">Open: {value ?? 'none'}</p>
    </div>
  )
}
