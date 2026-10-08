import { implement } from '@orpc/server'
import { categoryContract } from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'

const implementer = implement(categoryContract).$context<Context>()

export const categoryRouter = implementer.router({
  list: implementer.list.handler(async ({ input }) => {
    let sql = `SELECT * FROM categories`
    const params: any[] = []
    if (input?.onlyActive) {
      sql += ` WHERE is_active = true`
    }
    sql += ` ORDER BY ordering ASC, name ASC`

    const res = await pool.query(sql, params)
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      ordering: Number(r.ordering),
      parentId: r.parent_id || null,
      isActive: r.is_active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))
  }),

  getById: implementer.getById.handler(async ({ input, errors }) => {
    const res = await pool.query(`SELECT * FROM categories WHERE id = $1`, [input.id])
    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'دسته‌بندی یافت نشد' } })
    }
    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      ordering: Number(r.ordering),
      parentId: r.parent_id || null,
      isActive: r.is_active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  create: implementer.create.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود پرسنل الزامی است' } })
    }

    const dup = await pool.query(`SELECT id FROM categories WHERE slug = $1`, [input.slug])
    if (dup.rows.length > 0) {
      throw errors.CONFLICT({ data: { message: 'اسلاگ دسته‌بندی تکراری است' } })
    }

    const id = `cat-${input.slug}`
    const res = await pool.query(
      `INSERT INTO categories (id, name, slug, ordering, parent_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [id, input.name, input.slug, input.ordering ?? 0, input.parentId || null, input.isActive ?? true]
    )

    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      ordering: Number(r.ordering),
      parentId: r.parent_id || null,
      isActive: r.is_active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  update: implementer.update.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود پرسنل الزامی است' } })
    }

    const check = await pool.query(`SELECT * FROM categories WHERE id = $1`, [input.id])
    if (check.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'دسته‌بندی یافت نشد' } })
    }

    const cur = check.rows[0]
    const name = input.name ?? cur.name
    const slug = input.slug ?? cur.slug
    const ordering = input.ordering !== undefined ? input.ordering : cur.ordering
    const parentId = input.parentId !== undefined ? input.parentId : cur.parent_id
    const isActive = input.isActive !== undefined ? input.isActive : cur.is_active

    if (input.slug && input.slug !== cur.slug) {
      const dup = await pool.query(`SELECT id FROM categories WHERE slug = $1 AND id != $2`, [input.slug, input.id])
      if (dup.rows.length > 0) {
        throw errors.CONFLICT({ data: { message: 'اسلاگ جدید تکراری است' } })
      }
    }

    const res = await pool.query(
      `UPDATE categories SET name = $1, slug = $2, ordering = $3, parent_id = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, slug, ordering, parentId, isActive, input.id]
    )

    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      ordering: Number(r.ordering),
      parentId: r.parent_id || null,
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
      `UPDATE categories SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [input.id]
    )

    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'دسته‌بندی یافت نشد' } })
    }

    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      ordering: Number(r.ordering),
      parentId: r.parent_id || null,
      isActive: r.is_active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),
})
