import { implement } from '@orpc/server'
import { customerTypeContract } from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'
import { logAuditEvent } from '../services/audit'

const implementer = implement(customerTypeContract).$context<Context>()

export const customerTypeRouter = implementer.router({
  list: implementer.list.handler(async () => {
    const res = await pool.query(
      `SELECT id, name, slug, markup_percent, is_active, description, created_at, updated_at
       FROM customer_types ORDER BY markup_percent ASC`
    )

    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      markupPercent: Number(r.markup_percent),
      isActive: r.is_active,
      description: r.description || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))
  }),

  getById: implementer.getById.handler(async ({ input, errors }) => {
    const res = await pool.query(
      `SELECT id, name, slug, markup_percent, is_active, description, created_at, updated_at
       FROM customer_types WHERE id = $1`,
      [input.id]
    )

    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'نوع مشتری یافت نشد' } })
    }

    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      markupPercent: Number(r.markup_percent),
      isActive: r.is_active,
      description: r.description || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  create: implementer.create.handler(async ({ input, context, errors }) => {
    if (context.user?.role !== 'admin') {
      throw errors.FORBIDDEN({ data: { message: 'فقط مدیر کل مجاز به تعریف نوع مشتری جدید است' } })
    }

    const slugCheck = await pool.query(`SELECT id FROM customer_types WHERE slug = $1`, [input.slug])
    if (slugCheck.rows.length > 0) {
      throw errors.CONFLICT({ data: { message: 'اسلاگ نوع مشتری تکراری است' } })
    }

    const id = `ct-${input.slug}`
    const res = await pool.query(
      `INSERT INTO customer_types (id, name, slug, markup_percent, is_active, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [id, input.name, input.slug, input.markupPercent, input.isActive ?? true, input.description || null]
    )

    const r = res.rows[0]

    await logAuditEvent({
      actorType: 'staff',
      actorId: context.user.id,
      actorName: context.user.name,
      action: 'customer_type_created',
      entityType: 'customer_type',
      entityId: id,
      metadata: { markupPercent: input.markupPercent },
    })

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      markupPercent: Number(r.markup_percent),
      isActive: r.is_active,
      description: r.description || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  update: implementer.update.handler(async ({ input, context, errors }) => {
    if (context.user?.role !== 'admin') {
      throw errors.FORBIDDEN({ data: { message: 'فقط مدیر کل مجاز به ویرایش نوع مشتری است' } })
    }

    const check = await pool.query(`SELECT * FROM customer_types WHERE id = $1`, [input.id])
    if (check.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'نوع مشتری یافت نشد' } })
    }

    const current = check.rows[0]
    const newName = input.name ?? current.name
    const newSlug = input.slug ?? current.slug
    const newMarkup = input.markupPercent ?? current.markup_percent
    const newDesc = input.description !== undefined ? input.description : current.description
    const newActive = input.isActive !== undefined ? input.isActive : current.is_active

    if (input.slug && input.slug !== current.slug) {
      const dup = await pool.query(`SELECT id FROM customer_types WHERE slug = $1 AND id != $2`, [input.slug, input.id])
      if (dup.rows.length > 0) {
        throw errors.CONFLICT({ data: { message: 'اسلاگ جدید تکراری است' } })
      }
    }

    const res = await pool.query(
      `UPDATE customer_types
       SET name = $1, slug = $2, markup_percent = $3, description = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [newName, newSlug, newMarkup, newDesc, newActive, input.id]
    )

    const r = res.rows[0]

    await logAuditEvent({
      actorType: 'staff',
      actorId: context.user.id,
      actorName: context.user.name,
      action: 'customer_type_updated',
      entityType: 'customer_type',
      entityId: input.id,
      metadata: { oldMarkup: current.markup_percent, newMarkup },
    })

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      markupPercent: Number(r.markup_percent),
      isActive: r.is_active,
      description: r.description || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  toggleActive: implementer.toggleActive.handler(async ({ input, context, errors }) => {
    if (context.user?.role !== 'admin') {
      throw errors.FORBIDDEN({ data: { message: 'فقط مدیر کل مجاز به فعال/غیرفعال‌سازی است' } })
    }

    const res = await pool.query(
      `UPDATE customer_types SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [input.id]
    )

    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'نوع مشتری یافت نشد' } })
    }

    const r = res.rows[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      markupPercent: Number(r.markup_percent),
      isActive: r.is_active,
      description: r.description || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),
})
