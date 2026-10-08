import { getPayloadClient } from '@persianpart/cms/payload'

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
  const p = await getPayloadClient()

  // 1. Try Payload built-in auth (handles Authorization: Bearer <token> & cookies)
  try {
    const authResult = await p.auth({ headers: req.headers })
    if (authResult?.user) {
      const u = authResult.user as any
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
  } catch {
    // Continue to token parsing
  }

  // 2. Custom header fallback: Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    try {
      // Find customer by token or ID
      const userRes = await p.find({
        collection: 'users',
        where: {
          or: [
            { id: { equals: isNaN(Number(token)) ? token : Number(token) } },
            { phone: { equals: token } },
          ],
        },
        limit: 1,
      })

      if (userRes.docs.length > 0) {
        const u = userRes.docs[0] as any
        return {
          user: {
            id: u.id,
            phone: u.phone,
            fullName: u.fullName,
            role: 'customer',
          },
          req,
        }
      }
    } catch {
      // Ignored
    }
  }

  return {
    user: null,
    req,
  }
}
