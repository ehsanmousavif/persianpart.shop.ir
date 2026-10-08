import { implement } from '@orpc/server'
import {
  catalogContract,
  type CatalogProduct,
} from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'
import {
  calculateCustomerPrice,
  calculatePackaging,
} from '../services/pricing'
import { partsRouter } from './parts'
import { categoryRouter } from './category'
import { brandRouter } from './brand'
import { tagRouter } from './tag'
import { productRouter } from './product'

const implementer = implement(catalogContract).$context<Context>()

export const catalogRouter = implementer.router({
  list: implementer.list.handler(async ({ input, context }) => {
    // 1. Get markup for the logged in customer
    let markupPercent = 0
    if (context.customer) {
      const ctRes = await pool.query(
        `SELECT markup_percent FROM customer_types WHERE id = $1`,
        [context.customer.customerTypeId]
      )
      if (ctRes.rows.length > 0) {
        markupPercent = Number(ctRes.rows[0].markup_percent)
      }
    }

    const page = input.page || 1
    const limit = input.limit || 20
    const offset = (page - 1) * limit

    const whereClauses: string[] = ['p.is_active = true']
    const params: any[] = []

    if (input.search) {
      params.push(`%${input.search}%`)
      whereClauses.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`)
    }

    if (input.categoryId) {
      params.push(input.categoryId)
      whereClauses.push(`p.category_id = $${params.length}`)
    }

    if (input.brandId) {
      params.push(input.brandId)
      whereClauses.push(`p.brand_id = $${params.length}`)
    }

    if (input.color) {
      params.push(input.color)
      whereClauses.push(`p.color = $${params.length}`)
    }

    if (input.finish) {
      params.push(input.finish)
      whereClauses.push(`p.finish = $${params.length}`)
    }

    if (input.grade) {
      params.push(input.grade)
      whereClauses.push(`p.grade = $${params.length}`)
    }

    if (input.width) {
      params.push(input.width)
      whereClauses.push(`p.width = $${params.length}`)
    }

    if (input.height) {
      params.push(input.height)
      whereClauses.push(`p.height = $${params.length}`)
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM products p ${whereSql}`, params)
    const total = parseInt(countRes.rows[0].total, 10)

    params.push(limit)
    const limitIdx = params.length
    params.push(offset)
    const offsetIdx = params.length

    const res = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       ${whereSql}
       ORDER BY p.name ASC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const items: CatalogProduct[] = res.rows.map((r) => {
      const stock = Number(r.inventory_sqm)
      let availability: 'available' | 'limited' | 'out_of_stock' = 'available'
      if (stock <= 0) {
        availability = 'out_of_stock'
      } else if (stock <= 50) {
        availability = 'limited'
      }

      const finalPrice = calculateCustomerPrice(Number(r.base_price_per_sqm), markupPercent)

      return {
        id: r.id,
        sku: r.sku,
        name: r.name,
        slug: r.slug,
        categoryId: r.category_id || null,
        categoryName: r.category_name || undefined,
        brandId: r.brand_id || null,
        brandName: r.brand_name || undefined,
        color: r.color || null,
        finish: r.finish || null,
        grade: r.grade || null,
        tags: Array.isArray(r.tags) ? r.tags : [],
        width: Number(r.width),
        height: Number(r.height),
        piecesPerCarton: Number(r.pieces_per_carton),
        sqmPerCarton: Number(r.sqm_per_carton),
        cover: r.cover || null,
        gallery: Array.isArray(r.gallery) ? r.gallery : [],
        richDescription: r.rich_description || null,
        finalCustomerPricePerSqm: finalPrice,
        availability,
      }
    })

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }),

  getById: implementer.getById.handler(async ({ input, context, errors }) => {
    let markupPercent = 0
    if (context.customer) {
      const ctRes = await pool.query(
        `SELECT markup_percent FROM customer_types WHERE id = $1`,
        [context.customer.customerTypeId]
      )
      if (ctRes.rows.length > 0) {
        markupPercent = Number(ctRes.rows[0].markup_percent)
      }
    }

    const res = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = $1 AND p.is_active = true`,
      [input.id]
    )

    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'کالای مورد نظر در کاتالوگ یافت نشد' } })
    }

    const r = res.rows[0]
    const stock = Number(r.inventory_sqm)
    let availability: 'available' | 'limited' | 'out_of_stock' = 'available'
    if (stock <= 0) {
      availability = 'out_of_stock'
    } else if (stock <= 50) {
      availability = 'limited'
    }

    const finalPrice = calculateCustomerPrice(Number(r.base_price_per_sqm), markupPercent)

    return {
      id: r.id,
      sku: r.sku,
      name: r.name,
      slug: r.slug,
      categoryId: r.category_id || null,
      categoryName: r.category_name || undefined,
      brandId: r.brand_id || null,
      brandName: r.brand_name || undefined,
      color: r.color || null,
      finish: r.finish || null,
      grade: r.grade || null,
      tags: Array.isArray(r.tags) ? r.tags : [],
      width: Number(r.width),
      height: Number(r.height),
      piecesPerCarton: Number(r.pieces_per_carton),
      sqmPerCarton: Number(r.sqm_per_carton),
      cover: r.cover || null,
      gallery: Array.isArray(r.gallery) ? r.gallery : [],
      richDescription: r.rich_description || null,
      finalCustomerPricePerSqm: finalPrice,
      availability,
    }
  }),

  calculateCartons: implementer.calculateCartons.handler(async ({ input, context, errors }) => {
    let markupPercent = 0
    if (context.customer) {
      const ctRes = await pool.query(
        `SELECT markup_percent FROM customer_types WHERE id = $1`,
        [context.customer.customerTypeId]
      )
      if (ctRes.rows.length > 0) {
        markupPercent = Number(ctRes.rows[0].markup_percent)
      }
    }

    const prodRes = await pool.query(
      `SELECT id, sqm_per_carton, base_price_per_sqm FROM products WHERE id = $1 AND is_active = true`,
      [input.productId]
    )

    if (prodRes.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'کالا یافت نشد' } })
    }

    const prod = prodRes.rows[0]
    const sqmPerCarton = Number(prod.sqm_per_carton)
    const basePrice = Number(prod.base_price_per_sqm)

    const { cartonCount, actualSqm } = calculatePackaging(input.requestedSqm, sqmPerCarton)
    const pricePerSqm = calculateCustomerPrice(basePrice, markupPercent)
    const lineTotal = Math.round(actualSqm * pricePerSqm)

    return {
      productId: prod.id,
      sqmPerCarton,
      requestedSqm: input.requestedSqm,
      cartonCount,
      actualSqm,
      pricePerSqm,
      lineTotal,
    }
  }),

  // Sub-routers within unified catalog domain
  parts: partsRouter,
  categories: categoryRouter,
  brands: brandRouter,
  tags: tagRouter,
  manage: productRouter,
})

