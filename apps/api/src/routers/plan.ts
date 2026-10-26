import { sdk } from '../payload'
import { base, adminOnly } from '../rpc/base'
import { enrichPlanWithUserName } from './router.helpers'

const list = base.plan.list.handler(async ({ input, context }) => {
  const where: Record<string, any> = {}

  if (input?.status) {
    where.status = { equals: input.status }
  }

  if (input?.userId) {
    where.users = { contains: input.userId }
  }

  const result = await sdk.find({
    collection: 'plans',
    where: Object.keys(where).length > 0 ? where : undefined,
    limit: input?.limit || 50,
    page: input?.page || 1,
    depth: 2,
    sort: '-createdAt',
  })

  const currentUserName = context.user?.fullName || (context as any).name || 'همکار'
  const items = result.docs.map((doc: any) => enrichPlanWithUserName(doc, currentUserName))

  return {
    items,
    total: result.totalDocs,
  }
})

const getById = base.plan.getById.handler(async ({ input, context, errors }) => {
  const doc = await sdk.findByID({
    collection: 'plans',
    id: input.id,
    depth: 2,
  })

  if (!doc) {
    throw errors.NOT_FOUND()
  }

  const currentUserName = context.user?.fullName || (context as any).name || 'همکار'
  return enrichPlanWithUserName(doc, currentUserName)
})

const create = adminOnly.plan.create.handler(async ({ input }) => {
  let title = input.title
  if (!title || title.trim() === '') {
    let name = 'همکار'
    if (input.users && input.users.length > 0) {
      try {
        const u: any = await sdk.findByID({ collection: 'users', id: input.users[0] })
        if (u?.fullName) {
          name = u.fullName
        }
      } catch {
        // ignore
      }
    }
    title = `${name} عزیز، این طرح برای شماست`
  }

  return sdk.create({
    collection: 'plans',
    data: {
      title,
      users: input.users.map((u: any) => Number(u)),
      content: input.content,
    } as any,
    depth: 2,
  })
})

const update = adminOnly.plan.update.handler(async ({ input }) => {
  const { id, ...data } = input

  return sdk.update({
    collection: 'plans',
    id,
    data: data as any,
    depth: 2,
  })
})

export const plan = base.plan.router({
  list,
  getById,
  create,
  update,
})
