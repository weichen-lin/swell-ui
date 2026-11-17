'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@weichenlin/swell-ui'

export default function AccordionDemo() {
  return (
    <Accordion defaultValue="project" variant="line" headingLevel={3} className="w-full max-w-md">
      <AccordionItem value="project">
        <AccordionTrigger description="Name and identity">Project</AccordionTrigger>
        <AccordionContent>Project settings</AccordionContent>
      </AccordionItem>
      <AccordionItem value="members">
        <AccordionTrigger description="Who can access it">Members</AccordionTrigger>
        <AccordionContent>Member settings</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
