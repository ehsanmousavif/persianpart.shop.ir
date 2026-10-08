import { payload } from '../payload'
import { base } from '../rpc/base'

const list = base.plan.list.handler(async ({ input, context }) => {
  const where: Record<string, any> = {}

  if (input?.status) {
    where.status = { equals: input.status }
  }

  const targetUserId = input?.userId || context.user?.id
  if (targetUserId) {
    where.users = { contains: targetUserId }
  }

  const result = await payload.crud.plans.find({
    where: Object.keys(where).length > 0 ? where : undefined,
    limit: input?.limit || 50,
    page: input?.page || 1,
    depth: 2,
    sort: '-createdAt',
  })

  const currentUserName = context.user?.fullName || (context as any).name || 'همکار'

  const items = result.docs.map((doc: any) => {
    const dynamicTitle =
      doc.title && !doc.title.includes('{name}')
        ? doc.title
        : `${currentUserName} عزیز، این طرح برای شماست`

    return {
      ...doc,
      dynamicTitle: doc.dynamicTitle || dynamicTitle,
      title: doc.title ? doc.title.replace(/\{name\}/g, currentUserName) : dynamicTitle,
    }
  })

  return {
    items,
    total: result.totalDocs,
  }
})

const getById = base.plan.getById.handler(async ({ input, context, errors }) => {
  const doc = await payload.crud.plans.findByID({
    id: input.id,
    depth: 2,
  })

  if (!doc) {
    throw errors.NOT_FOUND()
  }

  const currentUserName = context.user?.fullName || (context as any).name || 'همکار'
  const dynamicTitle =
    doc.title && !doc.title.includes('{name}')
      ? doc.title
      : `${currentUserName} عزیز، این طرح برای شماست`

  return {
    ...doc,
    dynamicTitle: doc.dynamicTitle || dynamicTitle,
    title: doc.title ? doc.title.replace(/\{name\}/g, currentUserName) : dynamicTitle,
  }
})

const create = base.plan.create.handler(async ({ input }) => {
  let title = input.title
  if (!title || title.trim() === '') {
    let name = 'همکار'
    if (input.users && input.users.length > 0) {
      try {
        const u = await payload.crud.users.findByID({ id: input.users[0] })
        if (u && (u as any).fullName) {
          name = (u as any).fullName
        }
      } catch {
        // ignore
      }
    }
    title = `${name} عزیز، این طرح برای شماست`
  }

  return payload.crud.plans.create({
    data: {
      title,
      users: input.users,
      content: input.content,
      type: input.type || 'credit_terms',
      discountPercent: input.discountPercent,
      discountAmount: input.discountAmount,
      status: input.status,
      products: input.products,
      expiresAt: input.expiresAt,
    },
    depth: 2,
  })
})

const update = base.plan.update.handler(async ({ input }) => {
  const { id, ...data } = input

  return payload.crud.plans.update({
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
