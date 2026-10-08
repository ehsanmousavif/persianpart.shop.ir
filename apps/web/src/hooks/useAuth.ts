import { useState, useEffect, useCallback } from 'react'
import { api, type CustomerProfile, type StaffProfile } from '../lib/api-client'

export function useAuth() {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [staff, setStaff] = useState<StaffProfile | null>(null)
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('persianpart_token')
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    const currentToken = localStorage.getItem('persianpart_token')
    if (!currentToken) {
      setCustomer(null)
      setStaff(null)
      return
    }

    try {
      setIsLoading(true)
      if (currentToken.startsWith('staff_')) {
        const staffProfile = await api.auth.staff.me()
        setStaff(staffProfile)
        setCustomer(null)
      } else {
        const custProfile = await api.auth.customer.me()
        setCustomer(custProfile)
        setStaff(null)
      }
    } catch {
      // Invalid/expired token
      localStorage.removeItem('persianpart_token')
      setToken(null)
      setCustomer(null)
      setStaff(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const requestOtp = async (mobile: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.auth.customer.requestOtp({ mobile })
      return res
    } catch (err: any) {
      const msg = err.message || 'خطا در ارسال کد یکبار مصرف'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (mobile: string, code: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.auth.customer.verifyOtp({ mobile, code })
      localStorage.setItem('persianpart_token', res.token)
      setToken(res.token)
      setCustomer(res.customer)
      return res
    } catch (err: any) {
      const msg = err.message || 'کد تایید نادرست است'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const staffLogin = async (identifier: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.auth.staff.login({ identifier, password })
      localStorage.setItem('persianpart_token', res.token)
      setToken(res.token)
      setStaff(res.staff)
      return res
    } catch (err: any) {
      const msg = err.message || 'نام کاربری یا رمز عبور اشتباه است'
      setError(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('persianpart_token')
    setToken(null)
    setCustomer(null)
    setStaff(null)
  }

  return {
    token,
    customer,
    staff,
    isAuthenticated: !!token && (!!customer || !!staff),
    isStaff: !!staff,
    isAdmin: staff?.role === 'admin',
    isLoading,
    error,
    requestOtp,
    verifyOtp,
    staffLogin,
    logout,
    refreshSession: loadSession,
  }
}
