import { useState, useEffect } from 'react'

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

export const DEFAULT_USER: UserProfile = {
  id: 'usr-101',
  name: 'آرش دهقان',
  storeName: 'پخش بازرگانی پرشین پارت (تهران)',
  phone: '۰۹۱۲۳۴۵۶۷۸۹',
  province: 'تهران',
  city: 'تهران',
  address: 'بزرگراه فتح، خیابان هفدهم شهریور، کوچه آذر، پلاک ۱۴، انبار مرکزی',
  economicCode: '411589324156',
  creditLimit: 500000000,
  availableCredit: 320000000,
}

interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  pendingPhone: string | null
}

const STORAGE_KEY = 'persianpart_auth'

function getInitialState(): AuthState {
  if (typeof window === 'undefined') {
    return { isAuthenticated: true, user: DEFAULT_USER, pendingPhone: null }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // fallback
  }
  // Default to authenticated for rich demo experience out of the box
  return { isAuthenticated: true, user: DEFAULT_USER, pendingPhone: null }
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
  sendOtp: (phone: string) => {
    broadcast({ ...currentState, pendingPhone: phone })
    return true
  },
  verifyOtp: (code: string) => {
    // Mock validation: 12345 or any 5 digits is success unless 00000 (wrong) or 99999 (expired)
    if (code === '00000') {
      throw new Error('کد تایید وارد شده نادرست است.')
    }
    if (code === '99999') {
      throw new Error('کد تایید منقضی شده است. لطفاً درخواست کد مجدد دهید.')
    }
    broadcast({
      isAuthenticated: true,
      user: {
        ...DEFAULT_USER,
        phone: currentState.pendingPhone || DEFAULT_USER.phone,
      },
      pendingPhone: null,
    })
    return true
  },
  loginAsDemoUser: () => {
    broadcast({
      isAuthenticated: true,
      user: DEFAULT_USER,
      pendingPhone: null,
    })
  },
  logout: () => {
    broadcast({
      isAuthenticated: false,
      user: null,
      pendingPhone: null,
    })
  },
  updateProfile: (updated: Partial<UserProfile>) => {
    if (!currentState.user) return
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
    loginAsDemoUser: authStore.loginAsDemoUser,
    logout: authStore.logout,
    updateProfile: authStore.updateProfile,
  }
}
