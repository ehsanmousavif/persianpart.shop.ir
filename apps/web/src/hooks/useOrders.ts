import { useState, useEffect, useCallback } from 'react'
import { api, type Order, type OrderStatus } from '../lib/api-client'

export function useCustomerOrders(status?: OrderStatus) {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.order.list({ status })
      setOrders(res.items)
      setTotal(res.total)
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت لیست سفارش‌ها')
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    total,
    isLoading,
    error,
    refetch: fetchOrders,
  }
}

export function useOrderDetail(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.order.getById({ id: orderId })
      setOrder(res)
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت جزییات سفارش')
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
  }
}

export function useOrderActions() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const submitOrder = async (items: Array<{ productId: string; requestedSqm: number }>, notes?: string) => {
    setIsSubmitting(true)
    try {
      return await api.order.submit({ items, notes })
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelOrder = async (orderId: string, reason?: string) => {
    setIsCancelling(true)
    try {
      return await api.order.cancel({ id: orderId, reason })
    } finally {
      setIsCancelling(false)
    }
  }

  const prepareReorder = async (orderId: string) => {
    return await api.order.prepareReorder({ id: orderId })
  }

  return {
    submitOrder,
    cancelOrder,
    prepareReorder,
    isSubmitting,
    isCancelling,
  }
}
