import { handler } from '@/rpc/handler'
import { createContext } from '@/rpc/context'

async function handle(request: Request) {
  const { matched, response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: async () => createContext(request),
  })

  return matched ? response : new Response('Not found', { status: 404 })
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle
