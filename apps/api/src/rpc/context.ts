import { extractBearerToken, verifyToken, type UserJwtPayload } from '../lib/jwt'

export interface UserContext {
  id: string | number
  phone?: string
  fullName?: string
  email?: string
  role?: string
}

export interface Context {
  user: UserContext | null
  jwtPayload: UserJwtPayload | null
  req: Request
}

export async function createContext(req: Request): Promise<Context> {
  const token = extractBearerToken(req.headers)

  if (token) {
    const payload = await verifyToken(token)

    if (payload && payload.sub) {
      const id = isNaN(Number(payload.sub)) ? payload.sub : Number(payload.sub)
      return {
        user: {
          id,
          phone: payload.phone,
          fullName: payload.fullName,
          email: payload.email,
          role: payload.role || 'customer',
        },
        jwtPayload: payload,
        req,
      }
    }
  }

  return {
    user: null,
    jwtPayload: null,
    req,
  }
}
