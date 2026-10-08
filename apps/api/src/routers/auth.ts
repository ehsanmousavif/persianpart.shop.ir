import { implement } from '@orpc/server'
import { authContract } from '@persianpart/contract'
import type { Context } from '../context'
import {
  requestCustomerOtp,
  verifyCustomerOtp,
  loginStaff,
} from '../services/auth'
import { pool } from '../db'

const implementer = implement(authContract).$context<Context>()

export const authRouter = implementer.router({
  customer: {
    requestOtp: implementer.customer.requestOtp.handler(async ({ input, errors }) => {
      try {
        return await requestCustomerOtp(input.mobile)
      } catch (err: any) {
        const msg = err.message || 'خطا در ارسال کد یکبار مصرف'
        if (msg.includes('غیرفعال')) {
          throw errors.ACCOUNT_INACTIVE({ data: { message: msg } })
        }
        if (msg.includes('یافت نشد')) {
          throw errors.NOT_FOUND({ data: { message: msg } })
        }
        if (msg.includes('شکیبا باشید')) {
          throw errors.TOO_MANY_ATTEMPTS({ data: { message: msg, retryAfterSeconds: 60 } })
        }
        throw err
      }
    }),

    verifyOtp: implementer.customer.verifyOtp.handler(async ({ input, errors }) => {
      try {
        return await verifyCustomerOtp(input.mobile, input.code)
      } catch (err: any) {
        const msg = err.message || 'خطا در اعتبارسنجی کد'
        if (msg.includes('نادرست است')) {
          throw errors.OTP_INVALID({ data: { message: msg } })
        }
        if (msg.includes('منقضی شده')) {
          throw errors.OTP_EXPIRED({ data: { message: msg } })
        }
        if (msg.includes('بیش از حد مجاز')) {
          throw errors.TOO_MANY_ATTEMPTS({ data: { message: msg } })
        }
        throw err
      }
    }),

    me: implementer.customer.me.handler(async ({ context, errors }) => {
      if (!context.customer) {
        throw errors.UNAUTHORIZED({ data: { message: 'ورود به حساب مشتری الزامی است' } })
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
        throw errors.UNAUTHORIZED({ data: { message: 'پروفایل مشتری یافت نشد' } })
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
  },

  staff: {
    login: implementer.staff.login.handler(async ({ input, errors }) => {
      try {
        return await loginStaff(input.identifier, input.password)
      } catch (err: any) {
        const msg = err.message || 'خطا در ورود پرسنل'
        if (msg.includes('غیرفعال')) {
          throw errors.ACCOUNT_INACTIVE({ data: { message: msg } })
        }
        throw errors.INVALID_CREDENTIALS({ data: { message: msg } })
      }
    }),

    me: implementer.staff.me.handler(async ({ context, errors }) => {
      if (!context.user) {
        throw errors.UNAUTHORIZED({ data: { message: 'ورود پرسنل الزامی است' } })
      }

      const res = await pool.query(
        `SELECT id, name, mobile, email, role, is_active, created_at, updated_at
         FROM staff_users WHERE id = $1`,
        [context.user.id]
      )

      if (res.rows.length === 0) {
        throw errors.UNAUTHORIZED({ data: { message: 'حساب پرسنلی یافت نشد' } })
      }

      const s = res.rows[0]
      return {
        id: s.id,
        name: s.name,
        mobile: s.mobile || undefined,
        email: s.email || undefined,
        role: s.role,
        isActive: s.is_active,
        createdAt: new Date(s.created_at).toISOString(),
        updatedAt: new Date(s.updated_at).toISOString(),
      }
    }),
  },
})
