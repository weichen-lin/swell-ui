import { getLLMsFull } from '@/lib/llms'

export const revalidate = false

export async function GET() {
  return new Response(await getLLMsFull(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
