import { sign, verify, decode } from 'hono/jwt'
import type { SignatureAlgorithm } from 'hono/utils/jwt/jwa'

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.PAYLOAD_SECRET ||
  'persianpart_jwt_auth_secret_key_production_2026_super_secure'

export const JWT_ALGORITHM: SignatureAlgorithm = 'HS256'
export const JWT_ISSUER = 'persianpart.shop'
export const JWT_AUDIENCE = 'persianpart-client'
export const JWT_DEFAULT_EXPIRY_SECONDS = 30 * 24 * 60 * 60 // 30 days

export interface UserJwtPayload {
  sub: string
  phone?: string
  fullName?: string
  role?: string
  email?: string
  iat?: number
  exp?: number
  iss?: string
  aud?: string
  [key: string]: unknown
}

/**
 * Generates a signed JWT token for a user using Hono's native JWT engine
 */
export async function generateToken(
  user: {
    id: string | number
    phone?: string
    fullName?: string
    role?: string
    email?: string
  },
  expiresInSeconds: number = JWT_DEFAULT_EXPIRY_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const payload: UserJwtPayload = {
    sub: String(user.id),
    phone: user.phone || '',
    fullName: user.fullName || '',
    role: user.role || 'customer',
    email: user.email || '',
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: now,
    exp: now + expiresInSeconds,
  }

  return await sign(payload, JWT_SECRET, JWT_ALGORITHM)
}

/**
 * Verifies a JWT token using Hono's native verify helper
 * Validates expiration (exp), issue time (iat), and cryptographic signature
 */
export async function verifyToken(token: string): Promise<UserJwtPayload | null> {
  if (!token || typeof token !== 'string') return null

  try {
    const verified = await verify(token, JWT_SECRET, JWT_ALGORITHM)
    return verified as unknown as UserJwtPayload
  } catch (err) {
    // Token is expired, signature is mismatched, or token format is invalid
    return null
  }
}

/**
 * Decodes header and payload of a token without verifying signature
 */
export function decodeToken(token: string): { header: any; payload: any } | null {
  if (!token) return null
  try {
    return decode(token)
  } catch {
    return null
  }
}

/**
 * Extracts the Bearer token string from an Authorization header
 */
export function extractBearerToken(
  headerOrHeaders: Headers | string | null | undefined
): string | null {
  if (!headerOrHeaders) return null

  let authHeader: string | null = null

  if (typeof headerOrHeaders === 'string') {
    authHeader = headerOrHeaders
  } else if (typeof headerOrHeaders.get === 'function') {
    authHeader = headerOrHeaders.get('authorization')
  }

  if (!authHeader) return null

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}
