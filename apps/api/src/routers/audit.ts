import { implement } from '@orpc/server'
import {
  auditContract,
  type AuditEvent,
} from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'

const implementer = implement(auditContract).$context<Context>()

export const auditRouter = implementer.router({
  list: implementer.list.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'مشاهده لاگ‌های نظارتی فقط مخصوص پرسنل مجاز است' } })
    }

    const page = input.page || 1
    const limit = input.limit || 20
    const offset = (page - 1) * limit

    const whereClauses: string[] = []
    const params: any[] = []

    if (input.actorType) {
      params.push(input.actorType)
      whereClauses.push(`actor_type = $${params.length}`)
    }

    if (input.actorId) {
      params.push(input.actorId)
      whereClauses.push(`actor_id = $${params.length}`)
    }

    if (input.action) {
      params.push(input.action)
      whereClauses.push(`action = $${params.length}`)
    }

    if (input.entityType) {
      params.push(input.entityType)
      whereClauses.push(`entity_type = $${params.length}`)
    }

    if (input.fromDate) {
      params.push(input.fromDate)
      whereClauses.push(`timestamp >= $${params.length}`)
    }

    if (input.toDate) {
      params.push(input.toDate)
      whereClauses.push(`timestamp <= $${params.length}`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
    const countRes = await pool.query(`SELECT COUNT(*) as total FROM audit_events ${whereSql}`, params)
    const total = parseInt(countRes.rows[0].total, 10)

    params.push(limit)
    const limitIdx = params.length
    params.push(offset)
    const offsetIdx = params.length

    const res = await pool.query(
      `SELECT * FROM audit_events ${whereSql} ORDER BY timestamp DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const items: AuditEvent[] = res.rows.map((r) => ({
      id: r.id,
      actorType: r.actor_type,
      actorId: r.actor_id,
      actorName: r.actor_name || undefined,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      timestamp: new Date(r.timestamp).toISOString(),
      metadata: r.metadata || {},
    }))

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }),

  getById: implementer.getById.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی فقط برای پرسنل مجاز است' } })
    }

    const res = await pool.query(`SELECT * FROM audit_events WHERE id = $1`, [input.id])
    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'رویداد لاگ یافت نشد' } })
    }

    const r = res.rows[0]
    return {
      id: r.id,
      actorType: r.actor_type,
      actorId: r.actor_id,
      actorName: r.actor_name || undefined,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      timestamp: new Date(r.timestamp).toISOString(),
      metadata: r.metadata || {},
    }
  }),
})
