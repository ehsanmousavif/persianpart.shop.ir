import { payload } from '../payload'
import { base } from '../rpc/base'
import { ORPCError } from '@orpc/server'

const normalizePhone = (p?: string) => {
  if (!p) return ''
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  let normalized = p.trim()
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i))
  }
  return normalized.replace(/\s+/g, '')
}

const requestOtp = base.auth.requestOtp.handler(async ({ input }) => {
  const phone = normalizePhone(input.phone || input.mobile)
  if (!phone) {
    throw new ORPCError('BAD_REQUEST', { message: 'شماره تلفن همراه الزامی است.' })
  }

  // Customers must be pre-registered by admin in Payload panel
  const existing = await payload.crud.users.find({
    where: { phone: { equals: phone } },
    limit: 1,
  })

  const userDoc = existing.docs[0]
  if (!userDoc) {
    throw new ORPCError('FORBIDDEN', {
      message: 'شماره همراه شما در سامانه ثبت نشده است. افتتاح حساب کاربری مشتریان منحصراً توسط مدیریت پرشین پارت انجام می‌شود. لطفاً با پشتیبانی تماس بگیرید.',
    })
  }

  if (userDoc.status === 'suspended') {
    throw new ORPCError('FORBIDDEN', {
      message: 'حساب کاربری شما توسط مدیریت معلق شده است. لطفاً با پشتیبانی تماس بگیرید.',
    })
  }

  if (userDoc.status === 'pending') {
    throw new ORPCError('FORBIDDEN', {
      message: 'حساب کاربری شما در انتظار تایید مدارک توسط مدیریت است.',
    })
  }

  return {
    success: true,
    message: `کد تایید برای شماره ${phone} ارسال گردید.`,
  }
})

const verifyOtp = base.auth.verifyOtp.handler(async ({ input }) => {
  const phone = normalizePhone(input.phone || input.mobile)
  if (!phone) {
    throw new ORPCError('BAD_REQUEST', { message: 'شماره تلفن همراه الزامی است.' })
  }

  const existing = await payload.crud.users.find({
    where: { phone: { equals: phone } },
    limit: 1,
  })

  const userDoc = existing.docs[0]
  if (!userDoc) {
    throw new ORPCError('FORBIDDEN', {
      message: 'شماره همراه شما در سامانه ثبت نشده است. حساب کاربری مشتریان منحصراً توسط مدیریت پرشین پارت تعریف می‌گردد.',
    })
  }

  if (userDoc.status !== 'active') {
    throw new ORPCError('FORBIDDEN', {
      message: 'حساب کاربری شما غیرفعال یا مسدود است. لطفاً با پشتیبانی تماس بگیرید.',
    })
  }

  return {
    token: String(userDoc.id),
    user: userDoc,
    customer: userDoc,
  }
})

const session = base.auth.session.handler(async ({ context }) => {
  if (!context.user) return { user: null }
  try {
    const u = await payload.crud.users.findByID({ id: context.user.id })
    return { user: u }
  } catch {
    return { user: null }
  }
})

const logout = base.auth.logout.handler(async () => {
  return { success: true }
})

const customerRequestOtp = base.auth.customer.requestOtp.handler(async ({ input }) => {
  const phone = normalizePhone(input.phone || input.mobile)
  if (!phone) {
    throw new ORPCError('BAD_REQUEST', { message: 'شماره تلفن همراه الزامی است.' })
  }

  const existing = await payload.crud.users.find({
    where: { phone: { equals: phone } },
    limit: 1,
  })

  const userDoc = existing.docs[0]
  if (!userDoc) {
    throw new ORPCError('FORBIDDEN', {
      message: 'شماره همراه شما در سامانه ثبت نشده است. افتتاح حساب کاربری منحصراً توسط مدیریت انجام می‌شود.',
    })
  }

  if (userDoc.status !== 'active') {
    throw new ORPCError('FORBIDDEN', {
      message: 'حساب کاربری شما فعال نیست. لطفاً با پشتیبانی تماس بگیرید.',
    })
  }

  return {
    success: true,
    message: `کد تایید برای شماره ${phone} ارسال گردید.`,
  }
})

const customerVerifyOtp = base.auth.customer.verifyOtp.handler(async ({ input }) => {
  const phone = normalizePhone(input.phone || input.mobile)
  if (!phone) {
    throw new ORPCError('BAD_REQUEST', { message: 'شماره تلفن همراه الزامی است.' })
  }

  const existing = await payload.crud.users.find({
    where: { phone: { equals: phone } },
    limit: 1,
  })

  const userDoc = existing.docs[0]
  if (!userDoc) {
    throw new ORPCError('FORBIDDEN', {
      message: 'شماره همراه شما در سامانه ثبت نشده است.',
    })
  }

  if (userDoc.status !== 'active') {
    throw new ORPCError('FORBIDDEN', {
      message: 'حساب کاربری شما فعال نیست.',
    })
  }

  return {
    token: String(userDoc.id),
    user: userDoc,
    customer: {
      id: String(userDoc.id),
      contactName: userDoc.fullName || 'کاربر گرامی',
      storeName: userDoc.companyName || 'فروشگاه قطعات',
      mobile: userDoc.phone,
      province: userDoc.province || 'تهران',
      city: userDoc.city || 'تهران',
      address: userDoc.address || '',
      nationalCode: userDoc.nationalCode || '',
      economicCode: userDoc.economicCode || '',
      creditLimit: userDoc.creditLimit || 0,
    },
  }
})

const customerMe = base.auth.customer.me.handler(async ({ context }) => {
  if (!context.user) return null
  try {
    const userDoc = await payload.crud.users.findByID({ id: context.user.id })
    return {
      id: String(userDoc.id),
      contactName: userDoc.fullName || 'کاربر گرامی',
      storeName: userDoc.companyName || 'فروشگاه قطعات',
      mobile: userDoc.phone,
      province: userDoc.province || 'تهران',
      city: userDoc.city || 'تهران',
      address: userDoc.address || '',
      nationalCode: userDoc.nationalCode || '',
      economicCode: userDoc.economicCode || '',
      creditLimit: userDoc.creditLimit || 0,
    }
  } catch {
    return null
  }
})

const customerLogout = base.auth.customer.logout.handler(async () => {
  return { success: true }
})

const staffLogin = base.auth.staff.login.handler(async () => {
  return {
    token: 'staff-admin-token',
    staff: { id: 'admin-1', name: 'مدیر سیستم', role: 'admin' },
  }
})

const staffMe = base.auth.staff.me.handler(async () => {
  return { id: 'admin-1', name: 'مدیر سیستم', role: 'admin' }
})

const staffLogout = base.auth.staff.logout.handler(async () => {
  return { success: true }
})

export const auth = base.auth.router({
  requestOtp,
  verifyOtp,
  session,
  logout,
  customer: {
    requestOtp: customerRequestOtp,
    verifyOtp: customerVerifyOtp,
    me: customerMe,
    logout: customerLogout,
  },
  staff: {
    login: staffLogin,
    me: staffMe,
    logout: staffLogout,
  },
})
