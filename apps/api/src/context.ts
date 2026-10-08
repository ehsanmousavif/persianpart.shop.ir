import { getSession } from './services/auth'

export interface Context {
  headers: Headers
  ip?: string
  user?: {
    id: string
    role: string
    name?: string
  } | null
  customer?: {
    id: string
    storeName: string
    customerTypeId: string
    mobile?: string
  } | null
  actor?: {
    type: 'customer' | 'staff'
    id: string
    name: string
    role?: string
  } | null
}

export async function createContext(request: Request): Promise<Context> {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : undefined

  const authHeader = request.headers.get('authorization')
  let user: Context['user'] = null
  let customer: Context['customer'] = null
  let actor: Context['actor'] = null

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()

    // 1. Static dev tokens
    if (token === 'admin-token') {
      user = { id: 'staff-admin', role: 'admin', name: 'مدیر ارشد پرشین پارت' }
      actor = { type: 'staff', id: 'staff-admin', name: 'مدیر ارشد پرشین پارت', role: 'admin' }
    } else if (token === 'customer-token') {
      customer = { id: 'cust-1', storeName: 'بازرگانی کاشی و سرامیک البرز', customerTypeId: 'ct-wholesale', mobile: '09121111111' }
      actor = { type: 'customer', id: 'cust-1', name: 'بازرگانی کاشی و سرامیک البرز' }
    } else {
      // 2. Dynamic runtime session tokens
      const session = getSession(token)
      if (session) {
        if (session.type === 'staff') {
          user = { id: session.id, role: session.role || 'support', name: session.name }
          actor = { type: 'staff', id: session.id, name: session.name, role: session.role }
        } else if (session.type === 'customer') {
          customer = { id: session.id, storeName: session.name, customerTypeId: session.customerTypeId || 'ct-wholesale', mobile: session.mobile }
          actor = { type: 'customer', id: session.id, name: session.name }
        }
      }
    }
  }

  return {
    headers: request.headers,
    ip,
    user,
    customer,
    actor,
  }
}
