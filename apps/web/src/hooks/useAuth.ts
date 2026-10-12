import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type CustomerProfile, type StaffProfile } from '../lib/api-client'
import { queryKeys, mutationKeys } from '../lib/query-keys'

export function useAuth() {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('persianpart_token')
    }
    return null
  })

  const { data: sessionData, isLoading } = useQuery({
    queryKey: queryKeys.auth.session(token),
    queryFn: async () => {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('persianpart_token') : null
      if (!currentToken) {
        return { customer: null, staff: null }
      }
      try {
        if (currentToken.startsWith('staff_')) {
          const staffProfile = await api.auth.staff.me()
          return { staff: staffProfile as StaffProfile, customer: null }
        } else {
          const custProfile = await api.auth.customer.me()
          return { customer: custProfile as CustomerProfile, staff: null }
        }
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('persianpart_token')
        }
        setToken(null)
        return { customer: null, staff: null }
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const customer = sessionData?.customer || null
  const staff = sessionData?.staff || null

  const requestOtpMutation = useMutation({
    mutationKey: mutationKeys.auth.requestOtp,
    mutationFn: async (mobile: string) => {
      return await api.auth.customer.requestOtp({ mobile })
    },
  })

  const verifyOtpMutation = useMutation({
    mutationKey: mutationKeys.auth.verifyOtp,
    mutationFn: async ({ mobile, code }: { mobile: string; code: string }) => {
      const res = await api.auth.customer.verifyOtp({ mobile, code })
      if (typeof window !== 'undefined') {
        localStorage.setItem('persianpart_token', res.token)
      }
      setToken(res.token)
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
      return res
    },
  })

  const staffLoginMutation = useMutation({
    mutationKey: mutationKeys.auth.staffLogin,
    mutationFn: async ({ identifier, password }: { identifier: string; password: string }) => {
      const res = await api.auth.staff.login({ identifier, password })
      if (typeof window !== 'undefined') {
        localStorage.setItem('persianpart_token', res.token)
      }
      setToken(res.token)
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
      return res
    },
  })

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('persianpart_token')
    }
    setToken(null)
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
  }

  return {
    token,
    customer,
    staff,
    isAuthenticated: !!token && (!!customer || !!staff),
    isStaff: !!staff,
    isAdmin: staff?.role === 'admin',
    isLoading,
    error: requestOtpMutation.error
      ? (requestOtpMutation.error as Error).message
      : verifyOtpMutation.error
      ? (verifyOtpMutation.error as Error).message
      : staffLoginMutation.error
      ? (staffLoginMutation.error as Error).message
      : null,
    requestOtp: (mobile: string) => requestOtpMutation.mutateAsync(mobile),
    verifyOtp: (mobile: string, code: string) => verifyOtpMutation.mutateAsync({ mobile, code }),
    staffLogin: (identifier: string, password: string) => staffLoginMutation.mutateAsync({ identifier, password }),
    logout,
    refreshSession: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
  }
}
