'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@weichenlin/swell-ui'

export default function AccordionOutline() {
  return (
    <Accordion defaultValue="shipping" variant="outline" className="w-full max-w-md">
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Orders ship within two business days.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Return unused items within 30 days.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
