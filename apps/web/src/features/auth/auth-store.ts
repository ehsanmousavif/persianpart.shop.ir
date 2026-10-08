import { useState, useEffect } from 'react'
import { api } from '../../lib/api-client'

export interface UserProfile {
  id: string
  name: string
  storeName: string
  phone: string
  province: string
  city: string
  address: string
  economicCode: string
  creditLimit: number
  availableCredit: number
}

interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  pendingPhone: string | null
}

const STORAGE_KEY = 'persianpart_auth'
const TOKEN_KEY = 'persianpart_token'

function getInitialState(): AuthState {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null, pendingPhone: null }
  }
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (token && saved) {
      const parsed = JSON.parse(saved)
      return { isAuthenticated: true, user: parsed.user || null, pendingPhone: null }
    }
  } catch {
    // fallback
  }
  return { isAuthenticated: false, user: null, pendingPhone: null }
}

let currentState: AuthState = getInitialState()
const listeners = new Set<(state: AuthState) => void>()

function broadcast(nextState: AuthState) {
  currentState = nextState
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
    } catch {
      // ignore
    }
  }
  listeners.forEach((listener) => listener(currentState))
}

export const authStore = {
  getState: () => currentState,

  sendOtp: async (phone: string): Promise<boolean> => {
    try {
      await api.auth.requestOtp({ phone })
      broadcast({ ...currentState, pendingPhone: phone })
      return true
    } catch (err: any) {
      throw new Error(err.message || 'خطا در ارسال کد اعتبارسنجی')
    }
  },

  verifyOtp: async (code: string): Promise<boolean> => {
    const mobile = currentState.pendingPhone
    if (!mobile) {
      throw new Error('شماره موبایل ثبت نشده است. لطفاً ابتدا شماره را وارد کنید.')
    }

    try {
      const res = await api.auth.verifyOtp({ phone: mobile, code })
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, res.token)
      }

      const userData = (res.user || (res as any).customer || {}) as any
      const userProfile: UserProfile = {
        id: String(userData.id || 'user-1'),
        name: userData.fullName || userData.contactName || 'کاربر گرامی',
        storeName: userData.storeName || 'فروشگاه قطعات',
        phone: userData.phone || userData.mobile || mobile,
        province: userData.province || 'تهران',
        city: userData.city || 'تهران',
        address: userData.address || '',
        economicCode: '',
        creditLimit: 0,
        availableCredit: 0,
      }

      broadcast({
        isAuthenticated: true,
        user: userProfile,
        pendingPhone: null,
      })
      return true
    } catch (err: any) {
      throw new Error(err.message || 'کد تایید وارد شده نادرست یا منقضی است.')
    }
  },

  logout: () => {
    try {
      api.auth.logout()
    } catch {
      // Best effort
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(STORAGE_KEY)
    }
    broadcast({
      isAuthenticated: false,
      user: null,
      pendingPhone: null,
    })
  },

  updateProfile: async (updated: Partial<UserProfile>) => {
    if (!currentState.user) return

    try {
      await api.user.update({
        fullName: updated.name,
        address: updated.address,
      })
    } catch {
      // Best effort update
    }

    broadcast({
      ...currentState,
      user: { ...currentState.user, ...updated },
    })
  },
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(authStore.getState())

  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  return {
    ...state,
    sendOtp: authStore.sendOtp,
    verifyOtp: authStore.verifyOtp,
    logout: authStore.logout,
    updateProfile: authStore.updateProfile,
  }
}
