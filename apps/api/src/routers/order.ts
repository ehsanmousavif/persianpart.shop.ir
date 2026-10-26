import { sdk } from '../payload'
import { base, authed } from '../rpc/base'
import { calculateCartonMetrics } from './catalog.helpers'
import { finalizeOrderNumber, findOrderByIdOrNumber } from './router.helpers'

const all = authed.order.all.handler(async ({ context }) => {
  const allOrders = await sdk.find({
    collection: 'orders',
    where: {
      user: { equals: context.user.id },
    },
    limit: 100,
    depth: 2,
    sort: '-createdAt',
  })

  return allOrders.docs
})

const summary = authed.order.summary.handler(async ({ context }) => {
  const getOrderCount = async (status?: string) => {
    const { totalDocs } = await sdk.count({
      collection: 'orders',
      where: {
        user: { equals: context.user.id },
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

const detail = authed.order.detail.handler(async ({ input, context, errors }) => {
  const rawId = input.orderId || input.id || ''
  const orderDoc: any = await findOrderByIdOrNumber(rawId, 3)

  if (!orderDoc) {
    throw errors.NOT_FOUND()
  }

  const orderUserId =
    typeof orderDoc.user === 'object' && orderDoc.user !== null
      ? orderDoc.user.id
      : orderDoc.user

  if (orderUserId != context.user.id && context.user.role !== 'admin' && context.user.role !== 'superadmin') {
    throw errors.NOT_FOUND()
  }

  return orderDoc
})

const createCustomOrder = authed.order.createCustomOrder.handler(
  async ({ input, context }) => {
    const tempOrderNumber = `ptp ${Date.now().toString().slice(-6)}`
    const orderDoc = await sdk.create({
      collection: 'orders',
      data: {
        orderNumber: tempOrderNumber,
        user: Number(context.user.id),
        status: 'pending',
        items: [],
        subtotal: 0,
        finalTotal: 0,
        notes: `[سفارش اختصاصی - ${input.productType || 'عمومی'}]: ${input.notes || ''}`,
      },
    })

    const finalized = await finalizeOrderNumber(orderDoc)
    return { id: finalized.id, message: 'سفارش اختصاصی با موفقیت ثبت شد' }
  }
)

const submit = authed.order.submit.handler(async ({ input, context }) => {
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

  const tempOrderNumber = `ptp ${Date.now().toString().slice(-6)}`
  const orderDoc = await sdk.create({
    collection: 'orders',
    data: {
      orderNumber: tempOrderNumber,
      user: Number(context.user.id),
      status: 'pending',
      items: itemsData,
      subtotal: 0,
      finalTotal: 0,
      notes: input.notes,
      deliveryAddress: (input as any).deliveryAddress || 'انبار مرکزی بازرگانی دهقان',
    },
  })

  return finalizeOrderNumber(orderDoc)
})

const list = authed.order.list.handler(async ({ input, context }) => {
  const where: any = {}
  if (context.user?.id && context.user.role !== 'admin' && context.user.role !== 'superadmin') {
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
  const orderDoc = await findOrderByIdOrNumber(input.id, 3)
  if (!orderDoc) {
    throw errors.NOT_FOUND()
  }
  return orderDoc
})

const cancel = authed.order.cancel.handler(async ({ input, errors }) => {
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

  return sdk.update({
    collection: 'orders',
    id: input.id,
    data: {
      status: 'cancelled_by_customer',
      cancelledBy: 'customer',
      notes: input.reason ? `دلیل لغو: ${input.reason}` : 'لغو توسط کاربر',
    },
  })
})

const prepareReorder = authed.order.prepareReorder.handler(async ({ input }) => {
  const orderDoc: any = await sdk.findByID({
    collection: 'orders',
    id: input.id,
    depth: 2,
  })
  return {
    orderId: orderDoc.id,
    items: (orderDoc.items || []).map((i: any) => ({
      productId: i.product?.id || i.product,
      requestedSqm: i.requestedArea || 1,
    })),
  }
})

const validateCart = base.order.pricing.validateCart.handler(async ({ input }) => {
  let subtotal = 0
  const validatedItems = await Promise.all(
    input.items.map(async (item) => {
      const product: any = await sdk.findByID({ collection: 'products', id: item.productId })
      const requestedArea = item.requestedArea || item.requestedSqm || 1
      const pricePerSqm = Number(product.basePricePerSqm) || 500000
      const sqmPerCarton = Number(product.sqmPerCarton) || 1.44

      const metrics = await calculateCartonMetrics({
        productId: item.productId,
        requestedArea,
        pricePerSqm,
        sqmPerCarton,
      })

      subtotal += metrics.totalPrice

      return {
        productId: item.productId,
        productName: product.name || 'محصول',
        requestedArea,
        cartonCount: metrics.cartonCount,
        deliverableArea: metrics.deliverableArea,
        unitPrice: pricePerSqm,
        totalPrice: metrics.totalPrice,
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
})
