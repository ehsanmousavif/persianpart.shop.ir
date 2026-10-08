import { payload } from '@/payload'
import { base } from '@/rpc/base'

const requestOtp = base.auth.requestOtp.handler(async ({ input }) => {
  return {
    success: true,
    message: `کد تایید برای شماره ${input.phone} ارسال گردید.`,
  }
})

const verifyOtp = base.auth.verifyOtp.handler(async ({ input }) => {
  try {
    const phone = input.phone || input.mobile || ''
    const existing = await payload.crud.users.find({
      where: { phone: { equals: phone } },
      limit: 1,
    })

    let userDoc = existing.docs[0]
    if (!userDoc) {
      userDoc = await payload.crud.users.create({
        data: {
          username: phone,
          phone,
          email: `${phone}@persianpart.shop`,
          password: `Ppart@${phone.slice(-4)}!`,
          fullName: `خریدار ${phone.slice(-4)}`,
          customerType: 'regular',
          status: 'active',
        },
      })
    }

    return {
      token: String(userDoc.id),
      user: userDoc,
      customer: userDoc,
    }
  } catch (err: any) {
    console.error('[verifyOtp Error]:', err)
    throw err
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
  const phone = input.phone || input.mobile || ''
  return {
    success: true,
    message: `کد تایید برای شماره ${phone} ارسال گردید.`,
  }
})

const customerVerifyOtp = base.auth.customer.verifyOtp.handler(async ({ input }) => {
  const phone = input.phone || input.mobile || ''
  const existing = await payload.crud.users.find({
    where: { phone: { equals: phone } },
    limit: 1,
  })

  let userDoc = existing.docs[0]
  if (!userDoc) {
    userDoc = await payload.crud.users.create({
      data: {
        username: phone,
        phone,
        email: `${phone}@persianpart.shop`,
        password: `Ppart@${phone.slice(-4)}!`,
        fullName: `خریدار ${phone.slice(-4)}`,
        customerType: 'regular',
        status: 'active',
      },
    })
  }

  return {
    token: String(userDoc.id),
    user: userDoc,
    customer: {
      id: String(userDoc.id),
      contactName: userDoc.fullName || 'کاربر گرامی',
      storeName: 'فروشگاه قطعات',
      mobile: phone,
      province: 'تهران',
      city: 'تهران',
      address: userDoc.address || '',
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
      storeName: 'فروشگاه قطعات',
      mobile: userDoc.phone,
      province: 'تهران',
      city: 'تهران',
      address: userDoc.address || '',
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

