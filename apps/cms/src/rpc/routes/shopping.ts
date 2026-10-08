import { payload } from '@/payload'
import { base } from '@/rpc/base'

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

  const res = await payload.crud.products.find({
    where,
    limit: input?.limit || 50,
    page: input?.page || 1,
    depth: 2,
  })

  return res
})

const detail = base.shopping.detail.handler(async ({ input }) => {
  return payload.crud.products.findByID({
    id: input.id,
    depth: 2,
  })
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
      // fallback
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

export const shopping = base.shopping.router({
  all,
  detail,
  categories,
  brands,
  tags,
  calculateCartons,
})

const catalogList = base.catalog.list.handler(async ({ input }) => {
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
})

const catalogGetById = base.catalog.getById.handler(async ({ input }) => {
  return payload.crud.products.findByID({
    id: input.id,
    depth: 2,
  })
})

const catalogCategories = base.catalog.categories.handler(async ({ input }) => {
  const where = input?.onlyActive ? { isActive: { equals: true } } : {}
  const res = await payload.crud.categories.find({
    where,
    limit: 100,
    sort: 'ordering',
  })
  return res.docs
})

const catalogBrands = base.catalog.brands.handler(async ({ input }) => {
  const where = input?.onlyActive ? { isActive: { equals: true } } : {}
  const res = await payload.crud.brands.find({
    where,
    limit: 100,
    sort: 'name',
  })
  return res.docs
})

const catalogTags = base.catalog.tags.handler(async ({ input }) => {
  const where = input?.onlyActive ? { isActive: { equals: true } } : {}
  const res = await payload.crud.tags.find({
    where,
    limit: 100,
    sort: 'name',
  })
  return res.docs
})

const catalogCalculateCartons = base.catalog.calculateCartons.handler(async ({ input }) => {
  return await calcHelper(input)
})

export const catalog = base.catalog.router({
  list: catalogList,
  getById: catalogGetById,
  categories: catalogCategories,
  brands: catalogBrands,
  tags: catalogTags,
  calculateCartons: catalogCalculateCartons,
})

