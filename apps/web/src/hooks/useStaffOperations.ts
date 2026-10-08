import { useState, useCallback, useEffect } from 'react'
import {
  api,
  type Order,
  type OrderStatus,
  type ImportPreviewReport,
  type ImportRunSummary,
  type AuditEvent,
} from '../lib/api-client'

export function useStaffOrders(filters?: {
  status?: OrderStatus
  customerId?: string
  search?: string
  page?: number
  limit?: number
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.order.staffList(filters || {})
      setOrders(res.items)
      setTotal(res.total)
    } finally {
      setIsLoading(false)
    }
  }, [filters?.status, filters?.customerId, filters?.search, filters?.page, filters?.limit])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    const res = await api.order.staffUpdateStatus({ id: orderId, newStatus, note })
    fetchOrders()
    return res
  }

  const cancelOrder = async (orderId: string, reason: string, note?: string) => {
    const res = await api.order.staffCancel({ id: orderId, cancellationReason: reason, cancellationNote: note })
    fetchOrders()
    return res
  }

  return {
    orders,
    total,
    isLoading,
    refetch: fetchOrders,
    updateStatus,
    cancelOrder,
  }
}

export function useCsvPipeline() {
  const [preview, setPreview] = useState<ImportPreviewReport | null>(null)
  const [history, setHistory] = useState<ImportRunSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadAndPreview = async (filename: string, csvContent: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.system.csvImport.preview({ filename, csvContent })
      setPreview(res)
      return res
    } catch (err: any) {
      setError(err.message || 'خطا در پیش‌نمایش فایل CSV')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const applyPreview = async (importRunId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.system.csvImport.apply({ importRunId })
      setPreview(null)
      fetchHistory()
      return res
    } catch (err: any) {
      setError(err.message || 'خطا در اعمال تغییرات فایل CSV')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.system.csvImport.listRuns({})
      setHistory(res.items)
    } catch {
      // Ignored if not staff
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    preview,
    history,
    isLoading,
    error,
    uploadAndPreview,
    applyPreview,
    clearPreview: () => setPreview(null),
    refetchHistory: fetchHistory,
  }
}

export function useAuditEvents(filters?: { action?: any; entityType?: string; page?: number; limit?: number }) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.system.audit.list(filters || {})
      setEvents(res.items)
      setTotal(res.total)
    } catch {
      // Ignored
    } finally {
      setIsLoading(false)
    }
  }, [filters?.action, filters?.entityType, filters?.page, filters?.limit])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    total,
    isLoading,
    refetch: fetchEvents,
  }
}
