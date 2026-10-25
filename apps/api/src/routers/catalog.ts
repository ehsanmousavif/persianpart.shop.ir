import { sdk } from '../payload'
import { base } from '../rpc/base'
import { calculateCartonMetrics } from './catalog.helpers'

const list = base.catalog.list.handler(async ({ input, context }) => {
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

    const res = await sdk.find({
      collection: 'products',
      where,
      limit: input?.limit || 50,
      page: input?.page || 1,
      depth: 2,
    })

    // Calculate customer-specific markup if customer is authenticated
    let markupPercent = 0
    if (context?.user?.id) {
      try {
        const userDoc: any = await sdk.findByID({
          collection: 'users',
          id: context.user.id,
          depth: 1,
        })
        const ct = userDoc?.customerType
        if (ct && typeof ct === 'object') {
          markupPercent = Number(ct.markupPercent) || 0
        } else if (ct) {
          const ctDoc: any = await sdk.findByID({ collection: 'customer-types', id: ct })
          markupPercent = Number(ctDoc?.markupPercent) || 0
        }
      } catch {
        // fallback to standard price
      }
    }

    const mappedDocs = res.docs.map((prod: any) => {
      const basePrice = Number(prod.basePricePerSqm) || 0
      const finalPrice = Math.round(basePrice * (1 + markupPercent / 100))
      return {
        ...prod,
        finalCustomerPricePerSqm: finalPrice,
        appliedMarkupPercent: markupPercent,
      }
    })

    return {
      items: mappedDocs,
      total: res.totalDocs,
    }
  } catch (err) {
    console.error('=== [CATALOG LIST ERROR] ===', err)
    throw err
  }
})

const getById = base.catalog.getById.handler(async ({ input, context }) => {
  const prod: any = await sdk.findByID({
    collection: 'products',
    id: input.id,
    depth: 2,
  })

  if (!prod) return null

  let markupPercent = 0
  if (context?.user?.id) {
    try {
      const userDoc: any = await sdk.findByID({
        collection: 'users',
        id: context.user.id,
        depth: 1,
      })
      const ct = userDoc?.customerType
      if (ct && typeof ct === 'object') {
        markupPercent = Number(ct.markupPercent) || 0
      } else if (ct) {
        const ctDoc: any = await sdk.findByID({ collection: 'customer-types', id: ct })
        markupPercent = Number(ctDoc?.markupPercent) || 0
      }
    } catch {
      // fallback to standard price
    }
  }

  const basePrice = Number(prod.basePricePerSqm) || 0
  const finalPrice = Math.round(basePrice * (1 + markupPercent / 100))

  return {
    ...prod,
    finalCustomerPricePerSqm: finalPrice,
    appliedMarkupPercent: markupPercent,
  }
})

const categories = base.catalog.categories.handler(async ({ input }) => {
  const where = input?.onlyActive ? { isActive: { equals: true } } : undefined
  const res = await sdk.find({
    collection: 'categories',
    where,
    limit: 100,
    sort: 'ordering',
  })
  return res.docs
})

const brands = base.catalog.brands.handler(async ({ input }) => {
  const where = input?.onlyActive ? { isActive: { equals: true } } : undefined
  const res = await sdk.find({
    collection: 'brands',
    where,
    limit: 100,
    sort: 'name',
  })
  return res.docs
})

const tags = base.catalog.tags.handler(async ({ input }) => {
  const where = input?.onlyActive ? { isActive: { equals: true } } : undefined
  const res = await sdk.find({
    collection: 'tags',
    where,
    limit: 100,
    sort: 'name',
  })
  return res.docs
})

const dimensions = base.catalog.dimensions.handler(async ({ input }) => {
  const where = input?.onlyActive !== false ? { isActive: { equals: true } } : undefined
  const res = await sdk.find({
    collection: 'dimensions',
    where,
    limit: 100,
    sort: 'width',
  })
  return res.docs
})

const deleteProduct = base.catalog.deleteProduct.handler(async ({ input }) => {
  return await sdk.delete({ collection: 'products', id: input.id })
})

const deleteCategory = base.catalog.deleteCategory.handler(async ({ input }) => {
  return await sdk.delete({ collection: 'categories', id: input.id })
})

const calculateCartons = base.catalog.calculateCartons.handler(async ({ input }) => {
  return await calculateCartonMetrics(input)
})

export const catalog = base.catalog.router({
  list,
  getById,
  categories,
  brands,
  tags,
  dimensions,
  deleteProduct,
  deleteCategory,
  calculateCartons,
})
