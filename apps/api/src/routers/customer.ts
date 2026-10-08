import { implement } from '@orpc/server'
import { customerContract } from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'
import { logAuditEvent } from '../services/audit'

const implementer = implement(customerContract).$context<Context>()

export const customerRouter = implementer.router({
  getProfile: implementer.getProfile.handler(async ({ context, errors }) => {
    if (!context.customer) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود مشتری الزامی است' } })
    }

    const res = await pool.query(
      `SELECT c.id, c.store_name, c.contact_name, c.mobile, c.phone, c.province, c.city, c.address,
              c.customer_type_id, c.created_at, c.updated_at,
              ct.name as customer_type_name, ct.slug as customer_type_slug
       FROM customers c
       JOIN customer_types ct ON c.customer_type_id = ct.id
       WHERE c.id = $1`,
      [context.customer.id]
    )

    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'پروفایل مشتری یافت نشد' } })
    }

    const c = res.rows[0]
    return {
      id: c.id,
      storeName: c.store_name,
      contactName: c.contact_name,
      mobile: c.mobile,
      phone: c.phone || undefined,
      province: c.province,
      city: c.city,
      address: c.address,
      customerTypeId: c.customer_type_id,
      customerType: {
        id: c.customer_type_id,
        name: c.customer_type_name,
        slug: c.customer_type_slug,
      },
      createdAt: new Date(c.created_at).toISOString(),
      updatedAt: new Date(c.updated_at).toISOString(),
    }
  }),

  updateProfile: implementer.updateProfile.handler(async ({ input, context, errors }) => {
    if (!context.customer) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود مشتری الزامی است' } })
    }

    const check = await pool.query(`SELECT * FROM customers WHERE id = $1`, [context.customer.id])
    if (check.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'پروفایل یافت نشد' } })
    }

    const cur = check.rows[0]
    const storeName = input.storeName ?? cur.store_name
    const contactName = input.contactName ?? cur.contact_name
    const phone = input.phone !== undefined ? input.phone : cur.phone
    const province = input.province ?? cur.province
    const city = input.city ?? cur.city
    const address = input.address ?? cur.address

    const res = await pool.query(
      `UPDATE customers
       SET store_name = $1, contact_name = $2, phone = $3, province = $4, city = $5, address = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [storeName, contactName, phone, province, city, address, context.customer.id]
    )

    const c = res.rows[0]
    const ctRes = await pool.query(`SELECT name, slug FROM customer_types WHERE id = $1`, [c.customer_type_id])
    const ct = ctRes.rows[0]

    return {
      id: c.id,
      storeName: c.store_name,
      contactName: c.contact_name,
      mobile: c.mobile,
      phone: c.phone || undefined,
      province: c.province,
      city: c.city,
      address: c.address,
      customerTypeId: c.customer_type_id,
      customerType: ct ? { id: c.customer_type_id, name: ct.name, slug: ct.slug } : undefined,
      createdAt: new Date(c.created_at).toISOString(),
      updatedAt: new Date(c.updated_at).toISOString(),
    }
  }),

  staffList: implementer.staffList.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی فقط مخصوص پرسنل مجاز است' } })
    }

    const page = input.page || 1
    const limit = input.limit || 20
    const offset = (page - 1) * limit

    const whereClauses: string[] = []
    const params: any[] = []

    if (input.search) {
      params.push(`%${input.search}%`)
      whereClauses.push(`(c.store_name ILIKE $${params.length} OR c.contact_name ILIKE $${params.length} OR c.mobile ILIKE $${params.length})`)
    }

    if (input.customerTypeId) {
      params.push(input.customerTypeId)
      whereClauses.push(`c.customer_type_id = $${params.length}`)
    }

    if (input.isActive !== undefined) {
      params.push(input.isActive)
      whereClauses.push(`c.is_active = $${params.length}`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM customers c ${whereSql}`, params)
    const total = parseInt(countRes.rows[0].total, 10)

    params.push(limit)
    const limitIdx = params.length
    params.push(offset)
    const offsetIdx = params.length

    const res = await pool.query(
      `SELECT c.*, ct.name as customer_type_name, ct.slug as customer_type_slug, ct.markup_percent
       FROM customers c
       JOIN customer_types ct ON c.customer_type_id = ct.id
       ${whereSql}
       ORDER BY c.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const items = res.rows.map((r) => ({
      id: r.id,
      storeName: r.store_name,
      contactName: r.contact_name,
      mobile: r.mobile,
      phone: r.phone || undefined,
      province: r.province,
      city: r.city,
      address: r.address,
      customerTypeId: r.customer_type_id,
      customerType: {
        id: r.customer_type_id,
        name: r.customer_type_name,
        slug: r.customer_type_slug,
        markupPercent: Number(r.markup_percent),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isActive: r.is_active,
      internalNotes: r.internal_notes || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }))

    return {
      items,
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

    const res = await pool.query(
      `SELECT c.*, ct.name as customer_type_name, ct.slug as customer_type_slug, ct.markup_percent
       FROM customers c
       JOIN customer_types ct ON c.customer_type_id = ct.id
       WHERE c.id = $1`,
      [input.id]
    )

    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'مشتری یافت نشد' } })
    }

    const r = res.rows[0]
    return {
      id: r.id,
      storeName: r.store_name,
      contactName: r.contact_name,
      mobile: r.mobile,
      phone: r.phone || undefined,
      province: r.province,
      city: r.city,
      address: r.address,
      customerTypeId: r.customer_type_id,
      customerType: {
        id: r.customer_type_id,
        name: r.customer_type_name,
        slug: r.customer_type_slug,
        markupPercent: Number(r.markup_percent),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isActive: r.is_active,
      internalNotes: r.internal_notes || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  staffCreate: implementer.staffCreate.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const dup = await pool.query(`SELECT id FROM customers WHERE mobile = $1`, [input.mobile])
    if (dup.rows.length > 0) {
      throw errors.CONFLICT({ data: { message: 'مشتری با این شماره موبایل قبلاً ثبت شده است' } })
    }

    const id = `cust-${Date.now()}`
    const res = await pool.query(
      `INSERT INTO customers (
        id, store_name, contact_name, mobile, phone, province, city, address,
        customer_type_id, is_active, internal_notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        id,
        input.storeName,
        input.contactName,
        input.mobile,
        input.phone || null,
        input.province,
        input.city,
        input.address,
        input.customerTypeId,
        input.isActive ?? true,
        input.internalNotes || null,
      ]
    )

    const r = res.rows[0]
    await logAuditEvent({
      actorType: 'staff',
      actorId: context.user.id,
      actorName: context.user.name,
      action: 'customer_created',
      entityType: 'customer',
      entityId: id,
      metadata: { storeName: input.storeName, mobile: input.mobile },
    })

    const ctRes = await pool.query(`SELECT * FROM customer_types WHERE id = $1`, [input.customerTypeId])
    const ct = ctRes.rows[0]

    return {
      id: r.id,
      storeName: r.store_name,
      contactName: r.contact_name,
      mobile: r.mobile,
      phone: r.phone || undefined,
      province: r.province,
      city: r.city,
      address: r.address,
      customerTypeId: r.customer_type_id,
      customerType: ct
        ? {
            id: ct.id,
            name: ct.name,
            slug: ct.slug,
            markupPercent: Number(ct.markup_percent),
            isActive: ct.is_active,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : undefined,
      isActive: r.is_active,
      internalNotes: r.internal_notes || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  staffUpdate: implementer.staffUpdate.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const check = await pool.query(`SELECT * FROM customers WHERE id = $1`, [input.id])
    if (check.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'مشتری یافت نشد' } })
    }

    const cur = check.rows[0]
    const storeName = input.storeName ?? cur.store_name
    const contactName = input.contactName ?? cur.contact_name
    const phone = input.phone !== undefined ? input.phone : cur.phone
    const province = input.province ?? cur.province
    const city = input.city ?? cur.city
    const address = input.address ?? cur.address
    const customerTypeId = input.customerTypeId ?? cur.customer_type_id
    const internalNotes = input.internalNotes !== undefined ? input.internalNotes : cur.internal_notes
    const isActive = input.isActive !== undefined ? input.isActive : cur.is_active

    const res = await pool.query(
      `UPDATE customers
       SET store_name = $1, contact_name = $2, phone = $3, province = $4, city = $5,
           address = $6, customer_type_id = $7, internal_notes = $8, is_active = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [storeName, contactName, phone, province, city, address, customerTypeId, internalNotes, isActive, input.id]
    )

    const r = res.rows[0]
    await logAuditEvent({
      actorType: 'staff',
      actorId: context.user.id,
      actorName: context.user.name,
      action: 'customer_updated',
      entityType: 'customer',
      entityId: input.id,
    })

    const ctRes = await pool.query(`SELECT * FROM customer_types WHERE id = $1`, [customerTypeId])
    const ct = ctRes.rows[0]

    return {
      id: r.id,
      storeName: r.store_name,
      contactName: r.contact_name,
      mobile: r.mobile,
      phone: r.phone || undefined,
      province: r.province,
      city: r.city,
      address: r.address,
      customerTypeId: r.customer_type_id,
      customerType: ct
        ? {
            id: ct.id,
            name: ct.name,
            slug: ct.slug,
            markupPercent: Number(ct.markup_percent),
            isActive: ct.is_active,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : undefined,
      isActive: r.is_active,
      internalNotes: r.internal_notes || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),

  staffToggleActive: implementer.staffToggleActive.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const res = await pool.query(
      `UPDATE customers SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [input.id]
    )

    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'مشتری یافت نشد' } })
    }

    const r = res.rows[0]
    await logAuditEvent({
      actorType: 'staff',
      actorId: context.user.id,
      action: 'customer_status_toggled',
      entityType: 'customer',
      entityId: input.id,
      metadata: { isActive: r.is_active },
    })

    return {
      id: r.id,
      storeName: r.store_name,
      contactName: r.contact_name,
      mobile: r.mobile,
      phone: r.phone || undefined,
      province: r.province,
      city: r.city,
      address: r.address,
      customerTypeId: r.customer_type_id,
      isActive: r.is_active,
      internalNotes: r.internal_notes || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }
  }),
})
