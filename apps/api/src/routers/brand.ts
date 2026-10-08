import { implement } from '@orpc/server'
import { brandContract } from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'

const implementer = implement(brandContract).$context<Context>()

export const brandRouter = implementer.router({
  list: implementer.list.handler(async ({ input }) => {
    let sql = `SELECT * FROM brands`
    if (input?.onlyActive) {
      sql += ` WHERE is_active = true`
    }
    sql += ` ORDER BY name ASC`

    const res = await pool.query(sql)
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo || null,
      isActive: r.is_active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))
  }),

  getById: implementer.getById.handler(async ({ input, errors }) => {
    const res = await pool.query(`SELECT * FROM brands WHERE id = $1`, [input.id])
    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'برند یافت نشد' } })
    }
    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo || null,
      isActive: r.is_active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  create: implementer.create.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود پرسنل الزامی است' } })
    }

    const dup = await pool.query(`SELECT id FROM brands WHERE slug = $1`, [input.slug])
    if (dup.rows.length > 0) {
      throw errors.CONFLICT({ data: { message: 'اسلاگ برند تکراری است' } })
    }

    const id = `brand-${input.slug}`
    const res = await pool.query(
      `INSERT INTO brands (id, name, slug, logo, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [id, input.name, input.slug, input.logo || null, input.isActive ?? true]
    )

    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo || null,
      isActive: r.is_active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  update: implementer.update.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود پرسنل الزامی است' } })
    }

    const check = await pool.query(`SELECT * FROM brands WHERE id = $1`, [input.id])
    if (check.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'برند یافت نشد' } })
    }

    const cur = check.rows[0]
    const name = input.name ?? cur.name
    const slug = input.slug ?? cur.slug
    const logo = input.logo !== undefined ? input.logo : cur.logo
    const isActive = input.isActive !== undefined ? input.isActive : cur.is_active

    if (input.slug && input.slug !== cur.slug) {
      const dup = await pool.query(`SELECT id FROM brands WHERE slug = $1 AND id != $2`, [input.slug, input.id])
      if (dup.rows.length > 0) {
        throw errors.CONFLICT({ data: { message: 'اسلاگ جدید تکراری است' } })
      }
    }

    const res = await pool.query(
      `UPDATE brands SET name = $1, slug = $2, logo = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, slug, logo, isActive, input.id]
    )

    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo || null,
      isActive: r.is_active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  toggleActive: implementer.toggleActive.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود پرسنل الزامی است' } })
    }

    const res = await pool.query(
      `UPDATE brands SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [input.id]
    )

    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'برند یافت نشد' } })
    }

    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      logo: r.logo || null,
      isActive: r.is_active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),
})
