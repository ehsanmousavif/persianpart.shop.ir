import { payloadAuth } from '../payload'

export interface UserContext {
  id: string | number
  phone?: string
  fullName?: string
  email?: string
  role?: string
}

export interface Context {
  user: UserContext | null
  req: Request
}

export async function createContext(req: Request): Promise<Context> {
  const user = await payloadAuth(req.headers)

  if (user) {
    const u = user as any
    return {
      user: {
        id: u.id,
        phone: u.phone,
        fullName: u.fullName || u.name,
        email: u.email,
        role: u.role || 'customer',
      },
      req,
    }
  }

  return {
    user: null,
    req,
  }
}
