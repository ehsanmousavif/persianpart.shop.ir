import { sdk } from '../payload'
import { base } from '../rpc/base'

const all = base.order.all.handler(async ({ context }) => {
  const allOrders = await sdk.find({
    collection: 'orders',
    where: {
      user: { equals: context.user!.id },
    },
    limit: 100,
    depth: 2,
    sort: '-createdAt',
  })

  return allOrders.docs
})

const summary = base.order.summary.handler(async ({ context }) => {
  const getOrderCount = async (status?: string) => {
    const { totalDocs } = await sdk.count({
      collection: 'orders',
      where: {
        user: { equals: context.user!.id },
        ...(status && { status: { equals: status } }),
      },
    })

    return totalDocs
  }

  const [total, processing, completed] = await Promise.all([
    getOrderCount(),
    getOrderCount('processing'),
    getOrderCount('completed'),
  ])

  return { total, processing, completed }
})

const detail = base.order.detail.handler(async ({ input, context, errors }) => {
  const id = input.orderId || input.id || ''
  const orderDoc = await sdk.findByID({
    collection: 'orders',
    id,
    depth: 3,
  })

  const orderUserId =
    typeof orderDoc.user === 'object' && orderDoc.user !== null
      ? (orderDoc.user as any).id
      : orderDoc.user

  if (orderUserId != context.user!.id) {
    throw errors.NOT_FOUND()
  }

  return orderDoc
})

const createCustomOrder = base.order.createCustomOrder.handler(
  async ({ input, context }) => {
    const orderNumber = `PP-REQ-${Date.now().toString().slice(-6)}`
    const orderDoc = await sdk.create({
      collection: 'orders',
      data: {
        orderNumber,
        user: Number(context.user!.id),
        status: 'pending',
        items: [],
        subtotal: 0,
        finalTotal: 0,
        notes: `[سفارش اختصاصی - ${input.productType || 'عمومی'}]: ${input.notes || ''}`,
      },
    })

    return { id: orderDoc.id, message: 'سفارش اختصاصی با موفقیت ثبت شد' }
  }
)

const submit = base.order.submit.handler(async ({ input, context, errors }) => {
  let userId = context.user?.id
  if (!userId) {
    const activeUsers = await sdk.find({
      collection: 'users',
      where: { status: { equals: 'active' } },
      limit: 1,
    })
    if (activeUsers.docs.length > 0) {
      userId = activeUsers.docs[0].id
    } else {
      throw errors.UNAUTHORIZED()
    }
  }

  const itemsData = input.items.map((item) => {
    const requestedArea = item.requestedArea || item.requestedSqm || 1
    const pId = isNaN(Number(item.productId)) ? 1 : Number(item.productId)
    return {
      product: pId,
      requestedArea,
      cartonCount: 0,
      deliverableArea: requestedArea,
      unitPrice: 0,
      totalPrice: 0,
    }
  })

  const orderNumber = `PP-${Date.now().toString().slice(-8)}`
  // Leverage Payload collection hooks to calculate cartons, prices, orderNumber and initial timeline
  const orderDoc = await sdk.create({
    collection: 'orders',
    data: {
      orderNumber,
      user: Number(userId),
      status: 'pending',
      items: itemsData,
      subtotal: 0,
      finalTotal: 0,
      notes: input.notes,
      deliveryAddress: (input as any).deliveryAddress || 'انبار مرکزی بازرگانی دهقان',
    },
  })

  return orderDoc
})

const list = base.order.list.handler(async ({ input, context }) => {
  const where: any = {}
  if (context.user?.id) {
    where.user = { equals: context.user.id }
  }
  if (input?.status) {
    where.status = { equals: input.status }
  }

  const res = await sdk.find({
    collection: 'orders',
    where,
    limit: input?.limit || 100,
    page: input?.page || 1,
    depth: 2,
    sort: '-createdAt',
  })

  return {
    items: res.docs,
    total: res.totalDocs,
  }
})

const getById = base.order.getById.handler(async ({ input, errors }) => {
  const rawId = String(input.id || '')
  if (!rawId) {
    throw errors.NOT_FOUND()
  }

  // 1. If numeric ID, findByID
  if (!isNaN(Number(rawId))) {
    try {
      return await sdk.findByID({
        collection: 'orders',
        id: Number(rawId),
        depth: 3,
      })
    } catch {
      // fallback to orderNumber query
    }
  }

  // 2. Query by orderNumber or string id
  const res = await sdk.find({
    collection: 'orders',
    where: {
      or: [
        { orderNumber: { equals: rawId } },
        { id: { equals: isNaN(Number(rawId)) ? rawId : Number(rawId) } },
      ],
    },
    limit: 1,
    depth: 3,
  })

  if (res.docs.length === 0) {
    throw errors.NOT_FOUND()
  }

  return res.docs[0]
})

const cancel = base.order.cancel.handler(async ({ input, errors }) => {
  const orderDoc = await sdk.findByID({
    collection: 'orders',
    id: input.id,
    depth: 0,
  })

  if (!orderDoc) {
    throw errors.NOT_FOUND()
  }

  if (
    orderDoc.status === 'cancel' ||
    orderDoc.status === 'cancelled_by_customer' ||
    orderDoc.status === 'cancelled_by_admin'
  ) {
    return orderDoc
  }

  const deadline = new Date(orderDoc.createdAt).getTime() + 10 * 60 * 1000

  if (Date.now() > deadline) {
    throw errors.BAD_REQUEST({
      message: 'مهلت لغو سفارش توسط کاربر منقضی شده است',
    })
  }

  return await sdk.update({
    collection: 'orders',
    id: input.id,
    data: {
      status: 'cancelled_by_customer',
      cancelledBy: 'customer',
      notes: input.reason ? `دلیل لغو: ${input.reason}` : 'لغو توسط کاربر',
    },
  })
})

const prepareReorder = base.order.prepareReorder.handler(async ({ input }) => {
  const orderDoc = await sdk.findByID({
    collection: 'orders',
    id: input.id,
    depth: 2,
  })
  return {
    orderId: orderDoc.id,
    items: ((orderDoc as any).items || []).map((i: any) => ({
      productId: i.product?.id || i.product,
      requestedSqm: i.requestedArea || 1,
    })),
  }
})

const validateCart = base.order.pricing.validateCart.handler(async ({ input }) => {
  let subtotal = 0
  const validatedItems = await Promise.all(
    input.items.map(async (item) => {
      const product = await sdk.findByID({ collection: 'products', id: item.productId })
      const requestedArea = item.requestedArea || item.requestedSqm || 1
      const pricePerSqm = Number(product.basePricePerSqm) || 500000
      const sqmPerCarton = Number(product.sqmPerCarton) || 1.44
      const cartonCount = Math.ceil(requestedArea / sqmPerCarton)
      const deliverableArea = Math.round(cartonCount * sqmPerCarton * 100) / 100
      const itemTotal = Math.round(deliverableArea * pricePerSqm)
      subtotal += itemTotal

      return {
        productId: item.productId,
        productName: product.name || 'محصول',
        requestedArea,
        cartonCount,
        deliverableArea,
        unitPrice: pricePerSqm,
        totalPrice: itemTotal,
        hasIssues: false,
      }
    })
  )

  return {
    items: validatedItems,
    subtotal,
    discountAmount: 0,
    taxAmount: 0,
    finalTotal: subtotal,
    hasBlockingIssues: false,
  }
})

const staffList = base.order.staffList.handler(async ({ input }) => {
  const where: any = {}
  if (input?.status) {
    where.status = { equals: input.status }
  }
  if (input?.customerId) {
    where.user = { equals: input.customerId }
  }

  const res = await sdk.find({
    collection: 'orders',
    where,
    limit: input?.limit || 50,
    page: input?.page || 1,
    depth: 2,
    sort: '-createdAt',
  })

  return {
    items: res.docs,
    total: res.totalDocs,
  }
})

const staffUpdateStatus = base.order.staffUpdateStatus.handler(async ({ input }) => {
  return await sdk.update({
    collection: 'orders',
    id: input.id,
    data: {
      status: input.newStatus as any,
      notes: input.note,
    },
  })
})

const staffCancel = base.order.staffCancel.handler(async ({ input }) => {
  return await sdk.update({
    collection: 'orders',
    id: input.id,
    data: {
      status: 'cancel',
      cancelledBy: 'admin',
      notes: input.cancellationReason || input.cancellationNote || 'لغو توسط ادمین',
    },
  })
})

export const order = base.order.router({
  all,
  list,
  summary,
  detail,
  getById,
  createCustomOrder,
  submit,
  cancel,
  prepareReorder,
  pricing: {
    validateCart,
  },
  staffList,
  staffUpdateStatus,
  staffCancel,
})
