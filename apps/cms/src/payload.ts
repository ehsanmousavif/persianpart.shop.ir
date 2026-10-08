import config from './payload.config'
import { getPayload as getPayloadLocal, type Payload } from 'payload'

let cachedPayload: Payload | null = null

export async function getPayloadClient(): Promise<Payload> {
  if (!cachedPayload) {
    cachedPayload = await getPayloadLocal({ config })
  }
  return cachedPayload
}

export interface CrudOperations<T = any> {
  find: (args?: {
    where?: Record<string, any>
    limit?: number
    page?: number
    depth?: number
    sort?: string
    select?: Record<string, boolean>
  }) => Promise<{ docs: T[]; totalDocs: number; limit: number; totalPages: number; page: number }>
  findByID: (args: { id: string | number; depth?: number; select?: Record<string, boolean> }) => Promise<T>
  count: (args?: { where?: Record<string, any> }) => Promise<{ totalDocs: number }>
  create: (args: { data: Record<string, any>; depth?: number }) => Promise<T>
  update: (args: { id: string | number; data: Record<string, any>; depth?: number }) => Promise<T>
  delete: (args: { id: string | number }) => Promise<T>
}

type CollectionSlugs = 'orders' | 'products' | 'categories' | 'brands' | 'tags' | 'users' | 'admins' | 'media' | 'plans'

export const payload = {
  get client(): Promise<Payload> {
    return getPayloadClient()
  },
  crud: new Proxy({} as Record<CollectionSlugs, CrudOperations>, {
    get: (_, collection: string) => ({
      find: async (opts: any = {}) => {
        const client = await getPayloadClient()
        return client.find({ collection: collection as any, overrideAccess: true, ...opts })
      },
      findByID: async ({ id, ...opts }: any) => {
        const client = await getPayloadClient()
        return client.findByID({ collection: collection as any, id, overrideAccess: true, ...opts })
      },
      count: async (opts: any = {}) => {
        const client = await getPayloadClient()
        return client.count({ collection: collection as any, overrideAccess: true, ...opts })
      },
      create: async ({ data, ...opts }: any) => {
        const client = await getPayloadClient()
        return client.create({ collection: collection as any, data, overrideAccess: true, ...opts })
      },
      update: async ({ id, data, ...opts }: any) => {
        const client = await getPayloadClient()
        return client.update({ collection: collection as any, id, data, overrideAccess: true, ...opts })
      },
      delete: async ({ id, ...opts }: any) => {
        const client = await getPayloadClient()
        return client.delete({ collection: collection as any, id, overrideAccess: true, ...opts })
      },
    }),
  }),
}
