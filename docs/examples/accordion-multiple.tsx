'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@weichenlin/swell-ui'

export default function AccordionMultiple() {
  return (
    <Accordion type="multiple" defaultValue={['billing']} className="w-full max-w-md">
      <AccordionItem value="billing">
        <AccordionTrigger>Billing</AccordionTrigger>
        <AccordionContent>Invoices and payment methods</AccordionContent>
      </AccordionItem>
      <AccordionItem value="notifications">
        <AccordionTrigger>Notifications</AccordionTrigger>
        <AccordionContent>Email and push preferences</AccordionContent>
      </AccordionItem>
      <AccordionItem value="danger">
        <AccordionTrigger>Danger zone</AccordionTrigger>
        <AccordionContent>Transfer or delete the project</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
