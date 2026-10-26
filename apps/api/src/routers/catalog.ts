import { sdk } from '../payload'
import { base, adminOnly } from '../rpc/base'
import { calculateCartonMetrics } from './catalog.helpers'
import {
  fetchTaxonomy,
  getUserMarkupPercent,
  applyProductPricing,
} from './router.helpers'

const list = base.catalog.list.handler(async ({ input, context }) => {
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

  const markupPercent = await getUserMarkupPercent(context?.user?.id)
  const items = res.docs.map((prod: any) => applyProductPricing(prod, markupPercent))

  return {
    items,
    total: res.totalDocs,
  }
})

const getById = base.catalog.getById.handler(async ({ input, context }) => {
  const prod: any = await sdk.findByID({
    collection: 'products',
    id: input.id,
    depth: 2,
  })

  if (!prod) return null

  const markupPercent = await getUserMarkupPercent(context?.user?.id)
  return applyProductPricing(prod, markupPercent)
})

const categories = base.catalog.categories.handler(async ({ input }) => {
  return fetchTaxonomy('categories', { onlyActive: input?.onlyActive, sort: 'ordering' })
})

const brands = base.catalog.brands.handler(async ({ input }) => {
  return fetchTaxonomy('brands', { onlyActive: input?.onlyActive, sort: 'name' })
})

const tags = base.catalog.tags.handler(async ({ input }) => {
  return fetchTaxonomy('tags', { onlyActive: input?.onlyActive, sort: 'name' })
})

const dimensions = base.catalog.dimensions.handler(async ({ input }) => {
  return fetchTaxonomy('dimensions', { onlyActive: input?.onlyActive, sort: 'width' })
})

const deleteProduct = adminOnly.catalog.deleteProduct.handler(async ({ input }) => {
  return sdk.delete({ collection: 'products', id: input.id })
})

const deleteCategory = adminOnly.catalog.deleteCategory.handler(async ({ input }) => {
  return sdk.delete({ collection: 'categories', id: input.id })
})

const calculateCartons = base.catalog.calculateCartons.handler(async ({ input }) => {
  return calculateCartonMetrics(input)
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
