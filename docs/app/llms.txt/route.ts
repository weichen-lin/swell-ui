import { getLLMsIndex } from '@/lib/llms'

export const revalidate = false

export function GET() {
  return new Response(getLLMsIndex(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
