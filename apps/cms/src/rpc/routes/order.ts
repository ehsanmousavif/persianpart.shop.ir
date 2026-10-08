import { payload } from '@/payload'
import { base } from '@/rpc/base'

const all = base.order.all.handler(async ({ context }) => {
  const allOrders = await payload.crud.orders.find({
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
    const { totalDocs } = await payload.crud.orders.count({
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
  const order = await payload.crud.orders.findByID({
    id,
    depth: 3,
  })

  const orderUserId = typeof order.user === 'object' && order.user !== null ? (order.user as any).id : order.user

  if (orderUserId != context.user!.id) {
    throw errors.NOT_FOUND()
  }

  return order
})

export const createCustomOrder = base.order.createCustomOrder.handler(
  async ({ input, context }) => {
    const orderNumber = `PP-REQ-${Date.now().toString().slice(-6)}`
    const order = await payload.crud.orders.create({
      data: {
        orderNumber,
        user: context.user!.id,
        status: 'pending',
        items: [],
        subtotal: 0,
        finalTotal: 0,
        notes: `[سفارش اختصاصی - ${input.productType || 'عمومی'}]: ${input.notes || ''}`,
      },
    })

    return { id: order.id, message: 'سفارش اختصاصی با موفقیت ثبت شد' }
  }
)

export const submit = base.order.submit.handler(async ({ input, context, errors }) => {
  if (!context.user) {
    throw errors.UNAUTHORIZED()
  }

  let subtotal = 0
  const itemsData = await Promise.all(
    input.items.map(async (item) => {
      const requestedArea = item.requestedArea || item.requestedSqm || 1
      const product = await payload.crud.products.findByID({ id: item.productId })
      const pricePerSqm = (product as any).basePricePerSqm || 500000
      const sqmPerCarton = (product as any).sqmPerCarton || 1.44
      const cartonCount = Math.ceil(requestedArea / sqmPerCarton)
      const deliverableArea = Math.round(cartonCount * sqmPerCarton * 100) / 100
      const totalPrice = Math.round(deliverableArea * pricePerSqm)
      subtotal += totalPrice

      return {
        product: product.id,
        requestedArea,
        cartonCount,
        deliverableArea,
        unitPrice: pricePerSqm,
        totalPrice,
      }
    })
  )

  const orderNumber = `PP-${Date.now().toString().slice(-6)}`
  const order = await payload.crud.orders.create({
    data: {
      orderNumber,
      user: context.user.id,
      status: 'pending',
      items: itemsData,
      subtotal,
      discountAmount: 0,
      taxAmount: 0,
      finalTotal: subtotal,
      notes: input.notes,
      timeline: [
        {
          title: 'ثبت سفارش',
          description: 'سفارش توسط خریدار در سامانه ثبت گردید.',
          timestamp: new Date().toISOString(),
          status: 'pending',
        },
      ],
    },
  })

  return order
})

const list = base.order.list.handler(async ({ input, context }) => {
  const where: any = {}
  if (context.user?.id) {
    where.user = { equals: context.user.id }
  }
  if (input?.status) {
    where.status = { equals: input.status }
  }

  const res = await payload.crud.orders.find({
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

const getById = base.order.getById.handler(async ({ input }) => {
  return await payload.crud.orders.findByID({
    id: input.id,
    depth: 3,
  })
})

const cancel = base.order.cancel.handler(async ({ input }) => {
  return await payload.crud.orders.update({
    id: input.id,
    data: {
      status: 'cancelled',
      notes: input.reason ? `دلیل لغو: ${input.reason}` : undefined,
    },
  })
})

const prepareReorder = base.order.prepareReorder.handler(async ({ input }) => {
  const orderDoc = await payload.crud.orders.findByID({
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
      const product = await payload.crud.products.findByID({ id: item.productId })
      const requestedArea = item.requestedArea || item.requestedSqm || 1
      const pricePerSqm = (product as any).basePricePerSqm || 500000
      const sqmPerCarton = (product as any).sqmPerCarton || 1.44
      const cartonCount = Math.ceil(requestedArea / sqmPerCarton)
      const deliverableArea = Math.round(cartonCount * sqmPerCarton * 100) / 100
      const itemTotal = Math.round(deliverableArea * pricePerSqm)
      subtotal += itemTotal

      return {
        productId: item.productId,
        productName: (product as any).name || 'محصول',
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

  const res = await payload.crud.orders.find({
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
  return await payload.crud.orders.update({
    id: input.id,
    data: {
      status: input.newStatus,
      notes: input.note,
    },
  })
})

const staffCancel = base.order.staffCancel.handler(async ({ input }) => {
  return await payload.crud.orders.update({
    id: input.id,
    data: {
      status: 'cancelled',
      notes: input.cancellationReason || input.cancellationNote,
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

