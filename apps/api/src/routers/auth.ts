import { sdk } from '../payload'
import { base } from '../rpc/base'
import { ORPCError } from '@orpc/server'
import { generateToken } from '../lib/jwt'
import { sendKavenegarOtp } from '../lib/kavenegar'
import { createOtp, verifyOtp as verifyStoredOtp, normalizeDigits } from '../lib/otp'

const toPersianDigits = (s: string) => {
  const p = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return s.replace(/\d/g, (d) => p[Number(d)])
}

/**
 * Finds user in Payload CMS by checking both standard English and Persian digit representations
 */
const findUserByPhone = async (phone: string) => {
  const normalized = normalizeDigits(phone)
  const persian = toPersianDigits(normalized)

  const existing = await sdk.find({
    collection: 'users',
    where: {
      or: [
        { phone: { equals: normalized } },
        { phone: { equals: persian } },
      ],
    },
    limit: 1,
  })

  return existing.docs[0] || null
}

/**
 * Shared OTP request logic using Kavenegar pattern lookup service
 */
async function processRequestOtp(rawPhone: string) {
  const phone = normalizeDigits(rawPhone)
  if (!phone || !/^09\d{9}$/.test(phone)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'لطفاً شماره تلفن همراه معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد نمایید.',
    })
  }

  // Customers must be pre-registered by admin in Payload panel
  const userDoc = await findUserByPhone(phone)
  if (!userDoc) {
    throw new ORPCError('FORBIDDEN', {
      message:
        'شماره همراه شما در سامانه ثبت نشده است. افتتاح حساب کاربری مشتریان منحصراً توسط مدیریت پرشین پارت انجام می‌شود. لطفاً با پشتیبانی تماس بگیرید.',
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

  if (userDoc.status !== 'active') {
    throw new ORPCError('FORBIDDEN', {
      message: 'حساب کاربری شما فعال نیست. لطفاً با پشتیبانی تماس بگیرید.',
    })
  }

  // 1. Generate & store OTP
  let otpData: { code: string; expiresInSeconds: number; cooldownSeconds: number }
  try {
    otpData = createOtp(phone, {
      codeLength: 4,
      expirySeconds: 120,
      cooldownSeconds: 60,
    })
  } catch (err: any) {
    throw new ORPCError('BAD_REQUEST', {
      message: err.message || 'لطفاً کمی صبر کنید و دوباره تلاش نمایید.',
    })
  }

  // 2. Dispatch OTP via Kavenegar REST API (pattern: gcotp)
  try {
    await sendKavenegarOtp({
      receptor: phone,
      token: otpData.code,
      template: 'gcotp',
    })
  } catch (err: any) {
    console.error('[Kavenegar OTP Dispatch Error]', err)
    if (process.env.NODE_ENV === 'production') {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'خطا در ارسال پیامک کد تایید از طریق وب‌سرویس. لطفاً لحظاتی بعد مجدداً تلاش کنید.',
      })
    }
  }

  return {
    success: true,
    cooldownSeconds: otpData.cooldownSeconds,
    expiresInSeconds: otpData.expiresInSeconds,
    message: `کد تایید برای شماره ${toPersianDigits(phone)} ارسال گردید.`,
  }
}

/**
 * Shared OTP verification logic
 */
async function processVerifyOtp(rawPhone: string, rawCode: string) {
  const phone = normalizeDigits(rawPhone)
  const code = normalizeDigits(rawCode)

  if (!phone) {
    throw new ORPCError('BAD_REQUEST', { message: 'شماره تلفن همراه الزامی است.' })
  }

  if (!code) {
    throw new ORPCError('BAD_REQUEST', { message: 'کد تایید یکبار مصرف الزامی است.' })
  }

  const userDoc = await findUserByPhone(phone)
  if (!userDoc) {
    throw new ORPCError('FORBIDDEN', {
      message:
        'شماره همراه شما در سامانه ثبت نشده است. حساب کاربری مشتریان منحصراً توسط مدیریت پرشین پارت تعریف می‌گردد.',
    })
  }

  if (userDoc.status !== 'active') {
    throw new ORPCError('FORBIDDEN', {
      message: 'حساب کاربری شما غیرفعال یا مسدود است. لطفاً با پشتیبانی تماس بگیرید.',
    })
  }

  // Validate OTP code
  const verification = verifyStoredOtp(phone, code)
  if (!verification.success) {
    throw new ORPCError('BAD_REQUEST', {
      message: verification.error || 'کد وارد شده اشتباه یا منقضی است.',
    })
  }

  // Sign cryptographic JWT token via Hono JWT engine
  const token = await generateToken({
    id: userDoc.id,
    phone: userDoc.phone,
    fullName: userDoc.fullName,
    role: 'customer',
  })

  return {
    token,
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
      creditLimit: (userDoc as any).creditLimit || 0,
    },
  }
}

const requestOtp = base.auth.requestOtp.handler(async ({ input }) => {
  return await processRequestOtp(input.phone || input.mobile || '')
})

const verifyOtp = base.auth.verifyOtp.handler(async ({ input }) => {
  return await processVerifyOtp(input.phone || input.mobile || '', input.code || '')
})

const session = base.auth.session.handler(async ({ context }) => {
  if (!context.user) return { user: null }
  try {
    const u = await sdk.findByID({ collection: 'users', id: context.user.id })
    return { user: u }
  } catch {
    return { user: null }
  }
})

const logout = base.auth.logout.handler(async () => {
  return { success: true }
})

const customerRequestOtp = base.auth.customer.requestOtp.handler(async ({ input }) => {
  return await processRequestOtp(input.phone || input.mobile || '')
})

const customerVerifyOtp = base.auth.customer.verifyOtp.handler(async ({ input }) => {
  return await processVerifyOtp(input.phone || input.mobile || '', input.code || '')
})

const customerMe = base.auth.customer.me.handler(async ({ context }) => {
  if (!context.user) return null
  try {
    const userDoc = await sdk.findByID({ collection: 'users', id: context.user.id })
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
      creditLimit: (userDoc as any).creditLimit || 0,
    }
  } catch {
    return null
  }
})

const customerLogout = base.auth.customer.logout.handler(async () => {
  return { success: true }
})

const staffLogin = base.auth.staff.login.handler(async () => {
  const token = await generateToken({
    id: 'admin-1',
    fullName: 'مدیر سیستم',
    role: 'admin',
    email: 'admin@persianpart.shop',
  })

  return {
    token,
    staff: { id: 'admin-1', name: 'مدیر سیستم', role: 'admin' },
  }
})

const staffMe = base.auth.staff.me.handler(async ({ context }) => {
  if (!context.user || context.user.role !== 'admin') {
    return null
  }
  return { id: String(context.user.id), name: context.user.fullName || 'مدیر سیستم', role: 'admin' }
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
