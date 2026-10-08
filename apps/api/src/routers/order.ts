import { implement } from '@orpc/server'
import {
  orderContract,
  type Order,
} from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'
import {
  cancelOrder,
  getOrderById,
  prepareReorder,
  submitOrder,
  updateOrderStatus,
} from '../services/order'

const implementer = implement(orderContract).$context<Context>()

export const orderRouter = implementer.router({
  // Customer Endpoints
  submit: implementer.submit.handler(async ({ input, context, errors }) => {
    if (!context.customer) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود مشتری الزامی است' } })
    }

    try {
      return await submitOrder(context.customer.id, input.items, input.notes)
    } catch (err: any) {
      const msg = err.message || 'خطا در ثبت سفارش'
      if (msg.includes('موجودی')) {
        throw errors.INSUFFICIENT_STOCK({ data: { message: msg } })
      }
      throw errors.BAD_REQUEST({ data: { message: msg } })
    }
  }),

  list: implementer.list.handler(async ({ input, context, errors }) => {
    if (!context.customer) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود مشتری الزامی است' } })
    }

    const page = input.page || 1
    const limit = input.limit || 20
    const offset = (page - 1) * limit

    const whereClauses: string[] = ['customer_id = $1']
    const params: any[] = [context.customer.id]

    if (input.status) {
      params.push(input.status)
      whereClauses.push(`status = $${params.length}`)
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`
    const countRes = await pool.query(`SELECT COUNT(*) as total FROM orders ${whereSql}`, params)
    const total = parseInt(countRes.rows[0].total, 10)

    params.push(limit)
    const limitIdx = params.length
    params.push(offset)
    const offsetIdx = params.length

    const res = await pool.query(
      `SELECT id FROM orders ${whereSql} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const items: Order[] = []
    for (const r of res.rows) {
      items.push(await getOrderById(r.id))
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }),

  getById: implementer.getById.handler(async ({ input, context, errors }) => {
    if (!context.customer) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود مشتری الزامی است' } })
    }

    const order = await getOrderById(input.id)
    if (order.customerId !== context.customer.id) {
      throw errors.NOT_FOUND({ data: { message: 'سفارش یافت نشد' } })
    }

    return order
  }),

  cancel: implementer.cancel.handler(async ({ input, context, errors }) => {
    if (!context.customer) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود مشتری الزامی است' } })
    }

    try {
      return await cancelOrder(input.id, 'customer', context.customer.id, { reason: input.reason })
    } catch (err: any) {
      const msg = err.message || 'خطا در لغو سفارش'
      if (msg.includes('مهلت مجاز')) {
        throw errors.CANCELLATION_DEADLINE_EXPIRED({ data: { message: msg } })
      }
      if (msg.includes('وضعیت نهایی')) {
        throw errors.INVALID_STATUS_TRANSITION({ data: { message: msg } })
      }
      throw errors.NOT_FOUND({ data: { message: msg } })
    }
  }),

  prepareReorder: implementer.prepareReorder.handler(async ({ input, context, errors }) => {
    if (!context.customer) {
      throw errors.UNAUTHORIZED({ data: { message: 'ورود مشتری الزامی است' } })
    }

    try {
      return await prepareReorder(input.id, context.customer.id)
    } catch (err: any) {
      throw errors.NOT_FOUND({ data: { message: err.message || 'سفارش یافت نشد' } })
    }
  }),

  // Staff Endpoints
  staffList: implementer.staffList.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const page = input.page || 1
    const limit = input.limit || 20
    const offset = (page - 1) * limit

    const whereClauses: string[] = []
    const params: any[] = []

    if (input.status) {
      params.push(input.status)
      whereClauses.push(`status = $${params.length}`)
    }

    if (input.customerId) {
      params.push(input.customerId)
      whereClauses.push(`customer_id = $${params.length}`)
    }

    if (input.fromDate) {
      params.push(input.fromDate)
      whereClauses.push(`created_at >= $${params.length}`)
    }

    if (input.toDate) {
      params.push(input.toDate)
      whereClauses.push(`created_at <= $${params.length}`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
    const countRes = await pool.query(`SELECT COUNT(*) as total FROM orders ${whereSql}`, params)
    const total = parseInt(countRes.rows[0].total, 10)

    params.push(limit)
    const limitIdx = params.length
    params.push(offset)
    const offsetIdx = params.length

    const res = await pool.query(
      `SELECT id FROM orders ${whereSql} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const items: Order[] = []
    for (const r of res.rows) {
      items.push(await getOrderById(r.id))
    }

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

    try {
      return await getOrderById(input.id)
    } catch {
      throw errors.NOT_FOUND({ data: { message: 'سفارش یافت نشد' } })
    }
  }),

  staffUpdateStatus: implementer.staffUpdateStatus.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    try {
      return await updateOrderStatus(input.id, input.newStatus, context.user.id, input.note)
    } catch (err: any) {
      const msg = err.message || 'خطا در تغییر وضعیت'
      if (msg.includes('غیرمجاز است')) {
        throw errors.INVALID_STATUS_TRANSITION({ data: { message: msg } })
      }
      throw errors.NOT_FOUND({ data: { message: msg } })
    }
  }),

  staffCancel: implementer.staffCancel.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    try {
      return await cancelOrder(input.id, 'staff', context.user.id, {
        reason: input.cancellationReason,
        note: input.cancellationNote,
      })
    } catch (err: any) {
      const msg = err.message || 'خطا در لغو اداری سفارش'
      if (msg.includes('وضعیت نهایی')) {
        throw errors.INVALID_STATUS_TRANSITION({ data: { message: msg } })
      }
      throw errors.NOT_FOUND({ data: { message: msg } })
    }
  }),
})
