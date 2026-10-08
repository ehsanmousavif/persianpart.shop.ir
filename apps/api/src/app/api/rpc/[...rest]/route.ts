import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { CORSHandlerPlugin } from '@orpc/server/plugins'
import { createContext } from '@/context'
import { appRouter } from '@/routers'

const handler = new RPCHandler(appRouter, {
  plugins: [
    new CORSHandlerPlugin({
      origin: '*',
      exposeHeaders: ['Content-Disposition', 'Standard-Server'],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error('[oRPC Server Error]:', error)
    }),
  ],
})

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
