'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@weichenlin/swell-ui'

export default function AccordionDisabled() {
  return (
    <Accordion defaultValue="general" className="w-full max-w-md">
      <AccordionItem value="general">
        <AccordionTrigger>General</AccordionTrigger>
        <AccordionContent>General settings</AccordionContent>
      </AccordionItem>
      <AccordionItem value="billing" disabled>
        <AccordionTrigger description="Owners only">Billing</AccordionTrigger>
        <AccordionContent>Billing settings</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
