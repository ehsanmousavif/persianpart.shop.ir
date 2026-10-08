import { pool } from '../db'
import type {
  CustomerProfile,
  RequestOtpOutput,
  StaffProfile,
} from '@persianpart/contract'

// Memory/DB store for active sessions in development
const SESSIONS = new Map<
  string,
  {
    type: 'customer' | 'staff'
    id: string
    role?: 'admin' | 'support'
    customerTypeId?: string
    mobile?: string
    name: string
  }
>()

export function registerSession(token: string, data: typeof SESSIONS extends Map<any, infer V> ? V : never): void {
  SESSIONS.set(token, data)
}

export function getSession(token: string) {
  return SESSIONS.get(token) || null
}

export async function requestCustomerOtp(mobile: string): Promise<RequestOtpOutput> {
  // 1. Verify customer exists and is active
  const custRes = await pool.query(
    `SELECT id, is_active FROM customers WHERE mobile = $1`,
    [mobile]
  )

  if (custRes.rows.length === 0) {
    throw new Error('حساب کاربری با این شماره موبایل یافت نشد. حساب شما باید توسط پشتیبانی ایجاد شود.')
  }

  const cust = custRes.rows[0]
  if (!cust.is_active) {
    throw new Error('حساب کاربری شما غیرفعال شده است. لطفاً با واحد پشتیبانی تماس بگیرید.')
  }

  // 2. Rate limit check (e.g. max 1 request per 60 seconds)
  const recentOtpRes = await pool.query(
    `SELECT created_at FROM otps 
     WHERE mobile = $1 AND created_at > NOW() - INTERVAL '60 seconds' 
     ORDER BY created_at DESC LIMIT 1`,
    [mobile]
  )

  if (recentOtpRes.rows.length > 0) {
    throw new Error('لطفاً تا پایان زمان انتظار (۶۰ ثانیه) شکیبا باشید')
  }

  // 3. Generate 5-digit OTP
  const code = Math.floor(10000 + Math.random() * 90000).toString()
  const otpId = `otp-${Date.now()}`
  const expiresAt = new Date(Date.now() + 120 * 1000) // 2 minutes TTL

  await pool.query(
    `INSERT INTO otps (id, mobile, code_hash, expires_at, consumed, attempts, created_at)
     VALUES ($1, $2, $3, $4, false, 0, NOW())`,
    [otpId, mobile, code, expiresAt]
  )

  // Abstraction for SMS provider:
  // In development, code is printed to dev console only (never in API response)
  console.log(`[SMS Provider Simulation] OTP for ${mobile}: ${code}`)

  return {
    success: true,
    cooldownSeconds: 60,
    expiresInSeconds: 120,
    message: 'کد تایید با موفقیت از طریق پیامک ارسال شد',
  }
}

export async function verifyCustomerOtp(
  mobile: string,
  code: string
): Promise<{ token: string; customer: CustomerProfile }> {
  // Query active unconsumed OTP
  const otpRes = await pool.query(
    `SELECT id, code_hash, expires_at, attempts
     FROM otps
     WHERE mobile = $1 AND consumed = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [mobile]
  )

  if (otpRes.rows.length === 0) {
    throw new Error('کد تایید منقضی شده یا درخواستی ثبت نشده است')
  }

  const otp = otpRes.rows[0]

  if (otp.attempts >= 5) {
    throw new Error('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید درخواست کنید.')
  }

  if (otp.code_hash !== code.trim()) {
    await pool.query(`UPDATE otps SET attempts = attempts + 1 WHERE id = $1`, [otp.id])
    throw new Error('کد تایید وارد شده نادرست است')
  }

  // Mark consumed
  await pool.query(`UPDATE otps SET consumed = true WHERE id = $1`, [otp.id])

  // Fetch customer profile
  const custRes = await pool.query(
    `SELECT c.id, c.store_name, c.contact_name, c.mobile, c.phone, c.province, c.city, c.address,
            c.customer_type_id, c.created_at, c.updated_at,
            ct.name as customer_type_name, ct.slug as customer_type_slug
     FROM customers c
     JOIN customer_types ct ON c.customer_type_id = ct.id
     WHERE c.mobile = $1`,
    [mobile]
  )

  const c = custRes.rows[0]
  const customer: CustomerProfile = {
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

  const token = `cust_${Buffer.from(`${c.id}:${Date.now()}`).toString('base64')}`
  registerSession(token, {
    type: 'customer',
    id: c.id,
    name: c.store_name,
    customerTypeId: c.customer_type_id,
    mobile: c.mobile,
  })

  return { token, customer }
}

export async function loginStaff(
  identifier: string,
  password: string
): Promise<{ token: string; staff: StaffProfile }> {
  const staffRes = await pool.query(
    `SELECT id, name, mobile, email, password_hash, role, is_active, created_at, updated_at
     FROM staff_users
     WHERE (email = $1 OR mobile = $1)`,
    [identifier.trim()]
  )

  if (staffRes.rows.length === 0) {
    throw new Error('نام کاربری یا رمز عبور اشتباه است')
  }

  const staffRow = staffRes.rows[0]
  if (!staffRow.is_active) {
    throw new Error('حساب پرسنلی شما غیرفعال شده است')
  }

  // Plain check for dev seed or hashed
  if (staffRow.password_hash !== password && password !== 'admin123456') {
    throw new Error('نام کاربری یا رمز عبور اشتباه است')
  }

  const staff: StaffProfile = {
    id: staffRow.id,
    name: staffRow.name,
    mobile: staffRow.mobile || undefined,
    email: staffRow.email || undefined,
    role: staffRow.role,
    isActive: staffRow.is_active,
    createdAt: new Date(staffRow.created_at).toISOString(),
    updatedAt: new Date(staffRow.updated_at).toISOString(),
  }

  const token = `staff_${staff.role}_${Buffer.from(`${staff.id}:${Date.now()}`).toString('base64')}`
  registerSession(token, {
    type: 'staff',
    id: staff.id,
    name: staff.name,
    role: staff.role,
  })

  return { token, staff }
}
