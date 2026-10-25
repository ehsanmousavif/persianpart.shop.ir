/**
 * In-Memory One-Time Password (OTP) Manager
 * Manages OTP generation, lifecycle, rate limiting, and verification.
 */

export interface OtpRecord {
  code: string
  expiresAt: number
  cooldownUntil: number
  attempts: number
  createdAt: number
}

const OTP_EXPIRY_SECONDS = 120 // 2 minutes
const OTP_COOLDOWN_SECONDS = 60 // 1 minute between requests
const MAX_ATTEMPTS = 5

// In-memory store keyed by normalized phone number
const otpStore = new Map<string, OtpRecord>()

/**
 * Normalizes phone numbers and digits (Persian/Arabic to English, strips whitespace)
 */
export function normalizeDigits(input: string): string {
  if (!input) return ''
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  let normalized = input.trim()
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i))
  }
  return normalized.replace(/\s+/g, '')
}

/**
 * Generates a random 4-digit numeric code
 */
export function generateRandomCode(length = 4): string {
  if (length === 4) {
    // 1000 - 9999
    return String(Math.floor(1000 + Math.random() * 9000))
  }
  // Generic numeric code generator
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

/**
 * Creates and stores a new OTP for the given phone number
 */
export function createOtp(
  phone: string,
  options?: {
    codeLength?: number
    expirySeconds?: number
    cooldownSeconds?: number
  }
): { code: string; expiresInSeconds: number; cooldownSeconds: number } {
  const normalizedPhone = normalizeDigits(phone)
  const now = Date.now()

  const existing = otpStore.get(normalizedPhone)
  if (existing && now < existing.cooldownUntil) {
    const remainingSeconds = Math.ceil((existing.cooldownUntil - now) / 1000)
    throw new Error(`لطفاً قبل از درخواست مجدد کد، ${remainingSeconds} ثانیه شکیبا باشید.`)
  }

  const length = options?.codeLength ?? 4
  const expirySec = options?.expirySeconds ?? OTP_EXPIRY_SECONDS
  const cooldownSec = options?.cooldownSeconds ?? OTP_COOLDOWN_SECONDS

  const code = generateRandomCode(length)
  const expiresAt = now + expirySec * 1000
  const cooldownUntil = now + cooldownSec * 1000

  otpStore.set(normalizedPhone, {
    code,
    expiresAt,
    cooldownUntil,
    attempts: 0,
    createdAt: now,
  })

  // Development logger
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n🔑 [PersianPart OTP] Phone: ${normalizedPhone} | Code: ${code} | Expires in: ${expirySec}s\n`)
  }

  return {
    code,
    expiresInSeconds: expirySec,
    cooldownSeconds: cooldownSec,
  }
}

/**
 * Verifies the provided OTP code for a given phone number
 */
export function verifyOtp(
  phone: string,
  inputCode: string
): { success: boolean; error?: string } {
  const normalizedPhone = normalizeDigits(phone)
  const normalizedCode = normalizeDigits(inputCode)
  const now = Date.now()

  const record = otpStore.get(normalizedPhone)
  if (!record) {
    return {
      success: false,
      error: 'کد تایید برای این شماره صادر نشده یا منقضی شده است. لطفاً مجدداً درخواست دهید.',
    }
  }

  if (now > record.expiresAt) {
    otpStore.delete(normalizedPhone)
    return {
      success: false,
      error: 'کد تایید منقضی شده است. لطفاً کد جدید دریافت کنید.',
    }
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedPhone)
    return {
      success: false,
      error: 'تعداد دفعات ورود اشتباه بیش از حد مجاز بود. لطفاً کد جدید دریافت کنید.',
    }
  }

  if (record.code !== normalizedCode) {
    record.attempts += 1
    const remainingAttempts = MAX_ATTEMPTS - record.attempts
    return {
      success: false,
      error: remainingAttempts > 0
        ? 'کد وارد شده اشتباه است.'
        : 'کد اشتباه است و باطل شد. لطفاً کد جدید دریافت کنید.',
    }
  }

  // Code matched successfully — invalidate so it cannot be reused
  otpStore.delete(normalizedPhone)
  return { success: true }
}

// Periodic cleanup of expired records every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [phone, record] of otpStore.entries()) {
    if (now > record.expiresAt + 300000) {
      otpStore.delete(phone)
    }
  }
}, 300000).unref?.()
