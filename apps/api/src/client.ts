import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AppRouter } from './routers'

export type ApiClient = RouterClient<AppRouter>

export interface CreateApiClientOptions {
  baseURL?: string
  getToken?: () => string | null | undefined | Promise<string | null | undefined>
}

/**
 * Creates a typesafe oRPC client configured for PersianPart API
 */
export function createApiClient(options: CreateApiClientOptions = {}): ApiClient {
  const origin =
    options.baseURL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5149')

  const link = new RPCLink({
    origin,
    url: '/api/rpc',
    headers: async () => {
      const token = await options.getToken?.()
      return token ? { authorization: `Bearer ${token}` } : {}
    },
  })

  return createORPCClient<ApiClient>(link)
}
