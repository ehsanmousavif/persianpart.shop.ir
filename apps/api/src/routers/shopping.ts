import { payload } from '../payload'
import { base } from '../rpc/base'

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
      id: 'barbari',
      title: 'باربری بین‌شهری (شوش / پایانه)',
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

  const products = await payload.crud.products.find({
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

const addressList = base.shopping.addressList.handler(async ({ context, errors }) => {
  if (!context.user) {
    throw errors.UNAUTHORIZED({ message: 'برای مشاهده آدرس‌ها باید وارد حساب خود شوید.' })
  }

  const userDoc: any = await payload.crud.users.findByID({ id: context.user.id })
  return userDoc?.addresses || []
})

const mutateAddress = base.shopping.mutateAddress.handler(async ({ input, context, errors }) => {
  if (!context.user) {
    throw errors.UNAUTHORIZED({ message: 'برای ثبت یا ویرایش آدرس باید وارد حساب خود شوید.' })
  }

  const userDoc: any = await payload.crud.users.findByID({ id: context.user.id })
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

  const updatedUser: any = await payload.crud.users.update({
    id: context.user.id,
    data: {
      addresses: updatedAddresses,
    },
  })

  return updatedUser.addresses || []
})

const categories = base.shopping.categories.handler(async ({ input }) => {
  const where = input?.onlyActive ? { isActive: { equals: true } } : {}
  const res = await payload.crud.categories.find({
    where,
    limit: 100,
    sort: 'ordering',
  })
  return res.docs
})

const brands = base.shopping.brands.handler(async ({ input }) => {
  const where = input?.onlyActive ? { isActive: { equals: true } } : {}
  const res = await payload.crud.brands.find({
    where,
    limit: 100,
    sort: 'name',
  })
  return res.docs
})

const tags = base.shopping.tags.handler(async ({ input }) => {
  const where = input?.onlyActive ? { isActive: { equals: true } } : {}
  const res = await payload.crud.tags.find({
    where,
    limit: 100,
    sort: 'name',
  })
  return res.docs
})

const calcHelper = async (input: any) => {
  let sqmPerCarton = input.sqmPerCarton || 1.44
  let pricePerSqm = input.pricePerSqm || 500000
  const requestedArea = input.requestedArea || input.requestedSqm || 1

  if (input.productId && (!input.sqmPerCarton || !input.pricePerSqm)) {
    try {
      const prod: any = await payload.crud.products.findByID({ id: input.productId })
      if (prod) {
        sqmPerCarton = prod.sqmPerCarton || sqmPerCarton
        pricePerSqm = prod.basePricePerSqm || pricePerSqm
      }
    } catch {
      // fallback to input
    }
  }

  const cartonCount = Math.ceil(requestedArea / sqmPerCarton)
  const deliverableArea = Math.round(cartonCount * sqmPerCarton * 100) / 100
  const totalPrice = Math.round(deliverableArea * pricePerSqm)

  return {
    cartonCount,
    deliverableArea,
    totalPrice,
  }
}

const calculateCartons = base.shopping.calculateCartons.handler(async ({ input }) => {
  return await calcHelper(input)
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

  return await payload.crud.products.find({
    where,
    limit: input?.limit || 50,
    page: input?.page || 1,
    depth: 2,
  })
})

const detail = base.shopping.detail.handler(async ({ input }) => {
  return payload.crud.products.findByID({
    id: input.id,
    depth: 2,
  })
})

const createOrder = base.shopping.createOrder.handler(async ({ input, context, errors }) => {
  if (!context.user) {
    throw errors.UNAUTHORIZED({ message: 'برای ثبت سفارش باید وارد شوید.' })
  }

  const orderNumber = `PP-${Date.now().toString().slice(-8)}`
  const order = await payload.crud.orders.create({
    data: {
      orderNumber,
      user: context.user.id,
      status: 'pending',
      items: input.items || [],
      subtotal: input.subtotal || 0,
      finalTotal: input.finalTotal || input.subtotal || 0,
      notes: input.notes || '',
    },
  })

  return order
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

// Unified Catalog router
export const catalog = base.catalog.router({
  list: base.catalog.list.handler(async ({ input }) => {
    try {
      const where: Record<string, any> = {}
      if (input?.onlyActive !== false) {
        where.isActive = { equals: true }
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

      const res = await payload.crud.products.find({
        where,
        limit: input?.limit || 50,
        page: input?.page || 1,
        depth: 2,
      })

      return {
        items: res.docs,
        total: res.totalDocs,
      }
    } catch (err) {
      console.error('=== [CATALOG LIST ERROR] ===', err)
      throw err
    }
  }),
  getById: base.catalog.getById.handler(async ({ input }) => {
    return payload.crud.products.findByID({
      id: input.id,
      depth: 2,
    })
  }),
  categories: base.catalog.categories.handler(async ({ input }) => {
    const where = input?.onlyActive ? { isActive: { equals: true } } : {}
    const res = await payload.crud.categories.find({
      where,
      limit: 100,
      sort: 'ordering',
    })
    return res.docs
  }),
  brands: base.catalog.brands.handler(async ({ input }) => {
    const where = input?.onlyActive ? { isActive: { equals: true } } : {}
    const res = await payload.crud.brands.find({
      where,
      limit: 100,
      sort: 'name',
    })
    return res.docs
  }),
  tags: base.catalog.tags.handler(async ({ input }) => {
    const where = input?.onlyActive ? { isActive: { equals: true } } : {}
    const res = await payload.crud.tags.find({
      where,
      limit: 100,
      sort: 'name',
    })
    return res.docs
  }),
  calculateCartons: base.catalog.calculateCartons.handler(async ({ input }) => {
    return await calcHelper(input)
  }),
})
