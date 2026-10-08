import { implement } from '@orpc/server'
import {
  productContract,
  type Product,
  type ProductCompleteness,
} from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'
import { calculateCustomerPrice } from '../services/pricing'

const implementer = implement(productContract).$context<Context>()

export function calculateProductCompleteness(p: any): ProductCompleteness {
  const missingCritical: string[] = []
  const missingRecommended: string[] = []

  if (!p.sku) missingCritical.push('sku')
  if (!p.name) missingCritical.push('name')
  if (!p.width || Number(p.width) <= 0) missingCritical.push('width')
  if (!p.height || Number(p.height) <= 0) missingCritical.push('height')
  if (!p.sqm_per_carton || Number(p.sqm_per_carton) <= 0) missingCritical.push('sqmPerCarton')

  if (!p.category_id) missingRecommended.push('category')
  if (!p.brand_id) missingRecommended.push('brand')
  if (!p.cover) missingRecommended.push('cover')
  if (!p.gallery || (Array.isArray(p.gallery) && p.gallery.length === 0)) missingRecommended.push('gallery')
  if (!p.finish) missingRecommended.push('finish')
  if (!p.color) missingRecommended.push('color')

  const criticalWeight = 12 // 5 items = 60
  const recommendedWeight = 6.66 // 6 items = 40
  const criticalScore = (5 - missingCritical.length) * criticalWeight
  const recommendedScore = (6 - missingRecommended.length) * recommendedWeight
  const score = Math.round(criticalScore + recommendedScore)

  return {
    score,
    isComplete: missingCritical.length === 0 && missingRecommended.length === 0,
    missingCritical,
    missingRecommended,
  }
}

function mapProductRow(r: any): Product {
  const completeness = calculateProductCompleteness(r)
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    slug: r.slug,
    categoryId: r.category_id || null,
    brandId: r.brand_id || null,
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
    basePricePerSqm: Number(r.base_price_per_sqm),
    inventorySqm: Number(r.inventory_sqm),
    isActive: r.is_active,
    completeness,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }
}

export const productRouter = implementer.router({
  staffList: implementer.staffList.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی فقط برای پرسنل مجاز است' } })
    }

    const page = input.page || 1
    const limit = input.limit || 20
    const offset = (page - 1) * limit

    const whereClauses: string[] = []
    const params: any[] = []

    if (input.search) {
      params.push(`%${input.search}%`)
      whereClauses.push(`(name ILIKE $${params.length} OR sku ILIKE $${params.length})`)
    }

    if (input.categoryId) {
      params.push(input.categoryId)
      whereClauses.push(`category_id = $${params.length}`)
    }

    if (input.brandId) {
      params.push(input.brandId)
      whereClauses.push(`brand_id = $${params.length}`)
    }

    if (input.color) {
      params.push(input.color)
      whereClauses.push(`color = $${params.length}`)
    }

    if (input.finish) {
      params.push(input.finish)
      whereClauses.push(`finish = $${params.length}`)
    }

    if (input.grade) {
      params.push(input.grade)
      whereClauses.push(`grade = $${params.length}`)
    }

    if (input.isActive !== undefined) {
      params.push(input.isActive)
      whereClauses.push(`is_active = $${params.length}`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM products ${whereSql}`, params)
    const total = parseInt(countRes.rows[0].total, 10)

    params.push(limit)
    const limitIdx = params.length
    params.push(offset)
    const offsetIdx = params.length

    const res = await pool.query(
      `SELECT * FROM products ${whereSql} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    return {
      items: res.rows.map(mapProductRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }),

  staffGetById: implementer.staffGetById.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const res = await pool.query(`SELECT * FROM products WHERE id = $1`, [input.id])
    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'کالا یافت نشد' } })
    }

    return mapProductRow(res.rows[0])
  }),

  staffCreate: implementer.staffCreate.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const dupSku = await pool.query(`SELECT id FROM products WHERE sku = $1`, [input.sku])
    if (dupSku.rows.length > 0) {
      throw errors.CONFLICT({ data: { message: 'کد کالا (SKU) تکراری است' } })
    }

    const dupSlug = await pool.query(`SELECT id FROM products WHERE slug = $1`, [input.slug])
    if (dupSlug.rows.length > 0) {
      throw errors.CONFLICT({ data: { message: 'اسلاگ محصول تکراری است' } })
    }

    const id = `prod-${Date.now()}`
    const res = await pool.query(
      `INSERT INTO products (
        id, sku, name, slug, category_id, brand_id, color, finish, grade, tags,
        width, height, pieces_per_carton, sqm_per_carton, cover, gallery,
        rich_description, base_price_per_sqm, inventory_sqm, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      RETURNING *`,
      [
        id,
        input.sku,
        input.name,
        input.slug,
        input.categoryId || null,
        input.brandId || null,
        input.color || null,
        input.finish || null,
        input.grade || null,
        JSON.stringify(input.tags || []),
        input.width,
        input.height,
        input.piecesPerCarton,
        input.sqmPerCarton,
        input.cover || null,
        JSON.stringify(input.gallery || []),
        input.richDescription || null,
        input.basePricePerSqm,
        input.inventorySqm,
        input.isActive ?? true,
      ]
    )

    return mapProductRow(res.rows[0])
  }),

  staffUpdate: implementer.staffUpdate.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const check = await pool.query(`SELECT * FROM products WHERE id = $1`, [input.id])
    if (check.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'کالا یافت نشد' } })
    }

    const cur = check.rows[0]
    const name = input.name ?? cur.name
    const slug = input.slug ?? cur.slug
    const categoryId = input.categoryId !== undefined ? input.categoryId : cur.category_id
    const brandId = input.brandId !== undefined ? input.brandId : cur.brand_id
    const color = input.color !== undefined ? input.color : cur.color
    const finish = input.finish !== undefined ? input.finish : cur.finish
    const grade = input.grade !== undefined ? input.grade : cur.grade
    const tags = input.tags ? JSON.stringify(input.tags) : cur.tags
    const width = input.width ?? cur.width
    const height = input.height ?? cur.height
    const piecesPerCarton = input.piecesPerCarton ?? cur.pieces_per_carton
    const sqmPerCarton = input.sqmPerCarton ?? cur.sqm_per_carton
    const cover = input.cover !== undefined ? input.cover : cur.cover
    const gallery = input.gallery ? JSON.stringify(input.gallery) : cur.gallery
    const richDescription = input.richDescription !== undefined ? input.richDescription : cur.rich_description
    const basePrice = input.basePricePerSqm ?? cur.base_price_per_sqm
    const inventory = input.inventorySqm ?? cur.inventory_sqm
    const isActive = input.isActive !== undefined ? input.isActive : cur.is_active

    if (input.slug && input.slug !== cur.slug) {
      const dup = await pool.query(`SELECT id FROM products WHERE slug = $1 AND id != $2`, [input.slug, input.id])
      if (dup.rows.length > 0) {
        throw errors.CONFLICT({ data: { message: 'اسلاگ جدید تکراری است' } })
      }
    }

    const res = await pool.query(
      `UPDATE products
       SET name = $1, slug = $2, category_id = $3, brand_id = $4, color = $5, finish = $6,
           grade = $7, tags = $8, width = $9, height = $10, pieces_per_carton = $11,
           sqm_per_carton = $12, cover = $13, gallery = $14, rich_description = $15,
           base_price_per_sqm = $16, inventory_sqm = $17, is_active = $18, updated_at = NOW()
       WHERE id = $19
       RETURNING *`,
      [
        name,
        slug,
        categoryId,
        brandId,
        color,
        finish,
        grade,
        tags,
        width,
        height,
        piecesPerCarton,
        sqmPerCarton,
        cover,
        gallery,
        richDescription,
        basePrice,
        inventory,
        isActive,
        input.id,
      ]
    )

    return mapProductRow(res.rows[0])
  }),

  staffToggleActive: implementer.staffToggleActive.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const res = await pool.query(
      `UPDATE products SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [input.id]
    )

    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'کالا یافت نشد' } })
    }

    return mapProductRow(res.rows[0])
  }),

  staffPricePreview: implementer.staffPricePreview.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const prodRes = await pool.query(`SELECT id, sku, name, base_price_per_sqm FROM products WHERE id = $1`, [input.productId])
    if (prodRes.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'کالا یافت نشد' } })
    }

    const prod = prodRes.rows[0]
    let markup = input.overrideMarkupPercent ?? 0
    let ctName: string | undefined

    if (input.customerTypeId && input.overrideMarkupPercent === undefined) {
      const ct = await pool.query(`SELECT name, markup_percent FROM customer_types WHERE id = $1`, [input.customerTypeId])
      if (ct.rows.length > 0) {
        markup = Number(ct.rows[0].markup_percent)
        ctName = ct.rows[0].name
      }
    }

    const basePrice = Number(prod.base_price_per_sqm)
    const finalPrice = calculateCustomerPrice(basePrice, markup)

    return {
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      basePricePerSqm: basePrice,
      markupPercent: markup,
      customerTypeName: ctName,
      finalCustomerPricePerSqm: finalPrice,
    }
  }),
})
