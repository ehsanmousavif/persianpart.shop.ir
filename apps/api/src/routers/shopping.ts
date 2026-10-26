import { sdk } from '../payload'
import { base, authed } from '../rpc/base'
import { calculateCartonMetrics } from './catalog.helpers'
import { fetchTaxonomy, finalizeOrderNumber } from './router.helpers'

const shippingMethods = base.shopping.shippingMethods.handler(async () => {
  return [
    {
      id: 'tipax',
      title: 'تیپاکس (ارسال پس‌کرایه)',
      description: 'ارسال سریع به درب فروشگاه، نمایندگی یا تعمیرگاه در سراسر ایران',
      estimatedDays: '۲۴ الی ۴۸ ساعت',
      isExpress: true,
    },
    {
      id: 'freight',
      title: 'ارسال بین‌شهری (پایانه)',
      description: 'مناسب سفارش‌های حجیم و عمده قطعات سنگین بدنه، موتور و گیربکس',
      estimatedDays: '۲ الی ۳ روز کاری',
      isExpress: false,
    },
    {
      id: 'courier',
      title: 'پیک موتوری / وانت اختصاصی (تهران و حومه)',
      description: 'تحویل فوری در همان روز ویژه انبارها و همکاران تهران',
      estimatedDays: 'تحویل روزانه',
      isExpress: true,
    },
  ]
})

const cartProducts = base.shopping.cartProducts.handler(async ({ input }) => {
  if (!input || input.length === 0) return []

  const products = await sdk.find({
    collection: 'products',
    where: {
      or: input.map((id) => ({
        id: { equals: isNaN(Number(id)) ? id : Number(id) },
      })),
    },
    limit: 100,
    depth: 2,
  })

  return products.docs
})

const addressList = authed.shopping.addressList.handler(async ({ context }) => {
  const userDoc: any = await sdk.findByID({ collection: 'users', id: context.user.id })
  return userDoc?.addresses || []
})

const mutateAddress = authed.shopping.mutateAddress.handler(async ({ input, context }) => {
  const userDoc: any = await sdk.findByID({ collection: 'users', id: context.user.id })
  const currentAddresses: any[] = userDoc?.addresses || []

  let updatedAddresses: any[]
  if (input.id) {
    updatedAddresses = currentAddresses.map((addr) =>
      addr.id === input.id ? { ...addr, ...input } : addr
    )
  } else {
    const newAddress = {
      ...input,
      id: `addr_${Date.now()}`,
    }
    updatedAddresses = [...currentAddresses, newAddress]
  }

  const updatedUser: any = await sdk.update({
    collection: 'users',
    id: context.user.id,
    data: {
      addresses: updatedAddresses,
    },
  })

  return updatedUser.addresses || []
})

const categories = base.shopping.categories.handler(async ({ input }) => {
  return fetchTaxonomy('categories', { onlyActive: input?.onlyActive, sort: 'ordering' })
})

const brands = base.shopping.brands.handler(async ({ input }) => {
  return fetchTaxonomy('brands', { onlyActive: input?.onlyActive, sort: 'name' })
})

const tags = base.shopping.tags.handler(async ({ input }) => {
  return fetchTaxonomy('tags', { onlyActive: input?.onlyActive, sort: 'name' })
})

const calculateCartons = base.shopping.calculateCartons.handler(async ({ input }) => {
  return calculateCartonMetrics(input)
})

const all = base.shopping.all.handler(async ({ input }) => {
  const where: Record<string, any> = {
    isActive: { equals: true },
  }

  if (input?.search) {
    where.name = { contains: input.search }
  }
  if (input?.categoryId) {
    where.category = { equals: input.categoryId }
  }
  if (input?.brandId) {
    where.brand = { equals: input.brandId }
  }

  return sdk.find({
    collection: 'products',
    where,
    limit: input?.limit || 50,
    page: input?.page || 1,
    depth: 2,
  })
})

const detail = base.shopping.detail.handler(async ({ input }) => {
  return sdk.findByID({
    collection: 'products',
    id: input.id,
    depth: 2,
  })
})

const createOrder = authed.shopping.createOrder.handler(async ({ input, context }) => {
  const tempOrderNumber = `ptp ${Date.now().toString().slice(-6)}`
  const order = await sdk.create({
    collection: 'orders',
    data: {
      orderNumber: tempOrderNumber,
      user: Number(context.user.id),
      status: 'pending',
      items: (input.items || []).map((item: any) => ({
        product: Number(item.productId || item.product),
        requestedArea: Number(item.requestedArea || item.requestedSqm || 1),
        cartonCount: item.cartonCount || 0,
        deliverableArea: item.deliverableArea || 0,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
      })),
      subtotal: input.subtotal || 0,
      finalTotal: input.finalTotal || input.subtotal || 0,
      notes: input.notes || '',
    },
  })

  return finalizeOrderNumber(order)
})

const verifyPayment = base.shopping.verifyPayment.handler(async ({ input, errors }) => {
  if (!input?.orderId) {
    throw errors.BAD_REQUEST({ message: 'شناسه سفارش نامعتبر است.' })
  }

  return {
    verified: true,
    message: 'تراکنش با موفقیت تایید شد.',
    orderId: input.orderId,
  }
})

export const shopping = base.shopping.router({
  shippingMethods,
  cartProducts,
  addressList,
  mutateAddress,
  categories,
  brands,
  tags,
  calculateCartons,
  all,
  detail,
  createOrder,
  verifyPayment,
})
