import { useState, useEffect } from 'react'
import { type Order, type OrderItem, type TimelineStep } from '../../lib/mock-data/orders'
import { cartStore } from '../cart/cart-store'
import { api } from '../../lib/api-client'
import {
  formatPersianDate,
  formatPersianTimelineTs,
} from '../../lib/utils/date'

const STORAGE_KEY = 'persianpart_orders_v2'

function getInitialState(): Order[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    // Purge legacy fake mock orders storage
    localStorage.removeItem('persianpart_orders')

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        // Discard any fake IDs
        const filtered = parsed.filter(
          (o) => !['ord-101', 'ord-102', 'ord-103', 'ord-104'].includes(o.id) && !o.id.startsWith('ord-fake')
        )
        return filtered.map((o) => {
          if (o.date && (o.date.includes('2026') || o.date.includes('2025') || o.date.includes('2024') || o.date.startsWith('20'))) {
            return {
              ...o,
              date: formatPersianDate(o.createdAt || o.date),
            }
          }
          return o
        })
      }
    }
  } catch {
    // fallback
  }
  return []
}

let currentOrders: Order[] = getInitialState()
const listeners = new Set<(orders: Order[]) => void>()

function broadcast(orders: Order[]) {
  currentOrders = orders
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    } catch {
      // ignore
    }
  }
  listeners.forEach((listener) => listener(currentOrders))
}

export function buildFullOrderTimeline(
  doc: any,
  persianDate?: string,
  force3MinutesPassed?: boolean
): TimelineStep[] {
  const status = doc.status || 'pending'
  const isCancelledByCustomer = status === 'cancelled_by_customer' || doc.cancelledBy === 'customer'
  const isCancelled = status === 'cancel' || status === 'cancelled' || isCancelledByCustomer || status === 'cancelled_by_admin'

  const pDate = persianDate || (doc.createdAt ? formatPersianDate(doc.createdAt) : '')

  const formatTs = (ts?: string) => {
    if (!ts) return undefined
    return formatPersianTimelineTs(ts, pDate)
  }

  const createdAtMs = doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now()
  const deadlineMs = createdAtMs + 3 * 60 * 1000

  const is3MinutesPassed = force3MinutesPassed ?? (Date.now() >= deadlineMs)
  const isApproved = status === 'approve' || status === 'approved' || status === 'completed'

  // Cancellation Flow
  if (isCancelled) {
    const cancelTitle = isCancelledByCustomer ? 'لغو توسط مشتری' : 'لغو توسط ادمین'

    const cancelDesc = isCancelledByCustomer
      ? doc.notes || 'لغو توسط مشری'
      : doc.notes || "لغو توسط واحد. بازرگانی"

    const steps: TimelineStep[] = [
      {
        id: 'step-1',
        title: 'در حال بررسی واحد بازرگانی',
        description: 'سفارش در سامانه ثبت شده و در صف بررسی واحد بازرگانی قرار داشت.',
        timestamp: formatTs(doc.createdAt) || pDate,
        status: 'completed',
      },
    ]

    if (is3MinutesPassed) {
      steps.push({
        id: 'step-2',
        title: 'ثبت سفارش توسط واحد بازرگانی',
        description: 'سفارش توسط واحد بازرگانی بررسی اولیه شده بود.',
        timestamp: formatTs(new Date(createdAtMs + 3 * 60 * 1000).toISOString()),
        status: 'completed',
      })
    }

    steps.push({
      id: 'step-cancel',
      title: cancelTitle,
      description: cancelDesc,
      timestamp: formatTs(doc.updatedAt) || 'لغو نهایی',
      status: 'cancelled',
    })

    return steps
  }

  // Active / Normal Flow (3 stages)
  // Stage 1: در حال بررسی واحد بازرگانی (تایید اولیه ثبت)
  // Stage 2: ثبت سفارش توسط واحد بازرگانی (خودکار ۳ دقیقه بعد تایید می‌شود)
  // Stage 3: حواله ثبت شده (تکمیل شده) (با وضعیت approve تایید می‌شود)
  const step1Status: 'completed' = 'completed'
  const step2Status: 'completed' | 'current' = (isApproved || is3MinutesPassed) ? 'completed' : 'current'
  const step3Status: 'completed' | 'current' | 'pending' = isApproved ? 'completed' : is3MinutesPassed ? 'current' : 'pending'

  const step1Timestamp = formatTs(doc.createdAt) || pDate
  const step2Timestamp = (isApproved || is3MinutesPassed)
    ? formatTs(new Date(createdAtMs + 3 * 60 * 1000).toISOString())
    : '۳ دقیقه پس از بررسی اولیه'
  const step3Timestamp = isApproved
    ? formatTs(doc.updatedAt || doc.createdAt) || pDate
    : undefined

  return [
    {
      id: 'step-1',
      title: 'در حال بررسی واحد بازرگانی',
      description: 'سفارش در سامانه ثبت شده و در صف بررسی واحد بازرگانی قرار دارد.',
      timestamp: step1Timestamp,
      status: step1Status,
    },
    {
      id: 'step-2',
      title: 'ثبت سفارش توسط واحد بازرگانی',
      description: (isApproved || is3MinutesPassed)
        ? 'سفارش با موفقیت توسط واحد بازرگانی تایید و در سیستم انبارداری ثبت شد.'
        : 'در حال پردازش و ثبت سفارش توسط واحد بازرگانی (مهلت ۳ دقیقه)...',
      timestamp: step2Timestamp,
      status: step2Status,
    },
    {
      id: 'step-3',
      title: 'حواله ثبت شده (تکمیل شده)',
      description: isApproved
        ? 'حواله رسمی خروج از انبار صادر گردیده و فرآیند سفارش با موفقیت تکمیل شد.'
        : 'در انتظار تایید نهایی و صدور حواله رسمی توسط واحد بازرگانی.',
      timestamp: step3Timestamp,
      status: step3Status,
    },
  ]
}

export function mapDocToOrder(doc: any): Order {
  const createdAt = doc.createdAt || new Date().toISOString()
  const persianDate = formatPersianDate(createdAt)
  const normalizedStatus = doc.status === 'processing' ? 'pending' : (doc.status || 'pending')

  const createdAtMs = new Date(createdAt).getTime()
  const deadlineMs = createdAtMs + 3 * 60 * 1000
  const is3MinutesPassed = Date.now() >= deadlineMs

  let statusLabel = 'در حال بررسی واحد بازرگانی'
  if (normalizedStatus === 'pending') {
    statusLabel = is3MinutesPassed ? 'ثبت سفارش توسط واحد بازرگانی' : 'در حال بررسی واحد بازرگانی'
  } else if (normalizedStatus === 'approve' || normalizedStatus === 'approved') {
    statusLabel = 'حواله ثبت شده (تکمیل شده)'
  } else if (normalizedStatus === 'cancel' || normalizedStatus === 'cancelled') {
    statusLabel = doc.cancelledBy === 'customer' ? 'لغو توسط مشتری' : 'لغو توسط ادمین'
  }

  const items: OrderItem[] = (doc.items || []).map((i: any) => {
    const prod = typeof i.product === 'object' && i.product !== null ? i.product : null
    const width = prod?.width || 60
    const height = prod?.height || 120
    const coverUrl =
      prod?.cover?.url ||
      (prod?.cover?.filename ? `/api/media/file/${prod.cover.filename}` : '') ||
      (typeof prod?.cover === 'string' && prod.cover.startsWith('/') ? prod.cover : '') ||
      '/assets/images/placeholder.svg'
    return {
      productId: String(prod?.id || i.product || ''),
      productName: prod?.name || 'قطعه',
      productSlug: prod?.slug || '',
      productSku: prod?.sku || '',
      productImage: coverUrl,
      dimension: `${width}×${height}`,
      requestedArea: i.requestedArea || 1,
      cartonCount: i.cartonCount || 1,
      deliverableArea: i.deliverableArea || 1,
      unitPrice: i.unitPrice || 0,
      totalPrice: i.totalPrice || 0,
    }
  })

  const timeline = buildFullOrderTimeline(doc, persianDate, is3MinutesPassed)

  const userObj = typeof doc.user === 'object' && doc.user !== null ? doc.user : null

  return {
    id: String(doc.id),
    orderNumber: doc.orderNumber || `PP-${doc.id}`,
    date: persianDate,
    createdAt,
    status: normalizedStatus as any,
    cancelledBy: doc.cancelledBy || (normalizedStatus === 'cancelled_by_customer' ? 'customer' : 'admin'),
    statusLabel,
    storeName: userObj?.companyName || 'بازرگانی دهقان (پرشین پارت)',
    customerName: userObj?.fullName || 'خریدار محترم',
    customerPhone: userObj?.phone || '',
    deliveryAddress: doc.deliveryAddress || userObj?.address || 'انبار مرکزی بازرگانی دهقان',
    notes: doc.notes || '',
    cancellationDeadline: new Date(createdAtMs + 3 * 60 * 1000).toISOString(),
    items,
    subtotal: doc.subtotal || 0,
    discountAmount: doc.discountAmount || 0,
    taxAmount: doc.taxAmount || 0,
    finalTotal: doc.finalTotal || doc.subtotal || 0,
    timeline,
  }
}

export const orderStore = {
  getOrders: () => currentOrders,
  getOrderById: (id: string) => currentOrders.find((o) => o.id === id || o.orderNumber === id),

  fetchOrderById: async (id: string): Promise<Order | null> => {
    const existing = currentOrders.find((o) => o.id === id || o.orderNumber === id)
    if (existing) return existing

    try {
      const doc: any = await api.order.getById({ id })
      if (doc && doc.id) {
        const order = mapDocToOrder(doc)
        const updated = [order, ...currentOrders.filter((o) => o.id !== order.id)]
        broadcast(updated)
        return order
      }
    } catch (err) {
      console.warn('fetchOrderById error:', err)
    }
    return null
  },

  syncFromApi: async () => {
    try {
      const res = await api.order.list()
      if (res.items && res.items.length > 0) {
        const liveMapped: Order[] = res.items.map(mapDocToOrder)
        broadcast(liveMapped)
      }
    } catch {
      // Keep existing orders if API fails
    }
  },

  createOrder: (payload: {
    id?: string
    orderNumber?: string
    items: OrderItem[]
    subtotal: number
    discountAmount: number
    taxAmount: number
    finalTotal: number
    deliveryAddress: string
    notes?: string
  }): Order => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const newId = payload.id || `ord-${randomNum}`
    const orderNumber = payload.orderNumber || `PP-1405-${randomNum}`
    const now = new Date()
    const isoString = now.toISOString()
    const persianDate = formatPersianDate(now)
    const deadlineIso = new Date(now.getTime() + 3 * 60 * 1000).toISOString()
    const timeline = buildFullOrderTimeline(
      {
        status: 'pending',
        createdAt: isoString,
      },
      persianDate,
      false
    )

    const newOrder: Order = {
      id: newId,
      orderNumber,
      date: persianDate,
      createdAt: isoString,
      cancellationDeadline: deadlineIso,
      status: 'pending',
      statusLabel: 'در حال بررسی واحد بازرگانی',
      storeName: 'بازرگانی دهقان (پرشین پارت تهران)',
      customerName: 'آرش دهقان',
      customerPhone: '۰۹۱۲۳۴۵۶۷۸۹',
      deliveryAddress: payload.deliveryAddress,
      notes: payload.notes,
      items: payload.items,
      subtotal: payload.subtotal,
      discountAmount: payload.discountAmount,
      taxAmount: payload.taxAmount,
      finalTotal: payload.finalTotal,
      timeline,
    }

    const updated = [newOrder, ...currentOrders]
    broadcast(updated)
    cartStore.clearCart()
    return newOrder
  },

  cancelOrder: async (orderId: string, reason?: string): Promise<boolean> => {
    try {
      const numericId = !isNaN(Number(orderId)) ? Number(orderId) : orderId
      await api.order.cancel({ id: numericId, reason })
    } catch (err: any) {
      console.warn('API cancelOrder warning:', err?.message || err)
    }

    const updated = currentOrders.map((order) => {
      if (order.id === orderId || order.orderNumber === orderId) {
        return mapDocToOrder({
          ...order,
          status: 'cancel',
          cancelledBy: 'customer',
          notes: reason ? `دلیل لغو: ${reason}` : 'لغو توسط خریدار ',
          updatedAt: new Date().toISOString(),
        })
      }
      return order
    })
    broadcast(updated)
    return true
  },

  staffCancelOrder: async (orderId: string, reason?: string): Promise<boolean> => {
    try {
      const numericId = !isNaN(Number(orderId)) ? Number(orderId) : orderId
      await api.order.staffCancel({ id: numericId, cancellationReason: reason })
    } catch (err: any) {
      console.warn('API staffCancel warning:', err?.message || err)
    }

    const updated = currentOrders.map((order) => {
      if (order.id === orderId || order.orderNumber === orderId) {
        return mapDocToOrder({
          ...order,
          status: 'cancel',
          cancelledBy: 'admin',
          notes: reason || 'لغو توسط مدیریت / واحد بازرگانی',
          updatedAt: new Date().toISOString(),
        })
      }
      return order
    })
    broadcast(updated)
    return true
  },

  updateOrderStatus: async (orderId: string, newStatus: string, note?: string): Promise<boolean> => {
    try {
      const numericId = !isNaN(Number(orderId)) ? Number(orderId) : orderId
      const updatedDoc: any = await api.order.staffUpdateStatus({
        id: numericId,
        newStatus,
        note,
      })
      if (updatedDoc && updatedDoc.id) {
        const mapped = mapDocToOrder(updatedDoc)
        const updated = currentOrders.map((o) => (o.id === mapped.id ? mapped : o))
        broadcast(updated)
        return true
      }
    } catch (err: any) {
      console.warn('API updateOrderStatus warning:', err?.message || err)
    }

    // Local fallback update
    const updated = currentOrders.map((order) => {
      if (order.id === orderId || order.orderNumber === orderId) {
        const mapped = mapDocToOrder({
          ...order,
          status: newStatus,
          notes: note || order.notes,
        })
        return mapped
      }
      return order
    })
    broadcast(updated)
    return true
  },

  reorderToCart: (orderId: string): { success: boolean; warnings: string[] } => {
    const order = currentOrders.find((o) => o.id === orderId)
    if (!order) return { success: false, warnings: ['سفارش یافت نشد.'] }

    const warnings: string[] = []

    // Populate cart with order items
    order.items.forEach((item) => {
      const productObj: any = {
        id: item.productId,
        name: item.productName,
        slug: item.productSlug,
        sku: item.productSku,
        dimension: item.dimension,
        images: [item.productImage],
        finalCustomerPricePerSqm: item.unitPrice,
        sqmPerCarton: item.deliverableArea / (item.cartonCount || 1),
        stockCartons: 999,
        inventorySqm: 999,
      }
      cartStore.addItem(productObj, item.requestedArea)
    })

    return { success: true, warnings }
  },
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(orderStore.getOrders())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      orderStore.syncFromApi(),
      new Promise((resolve) => setTimeout(resolve, 1000)), // 1s visible skeleton delay
    ]).finally(() => {
      if (isMounted) {
        setIsLoading(false)
      }
    })

    listeners.add(setOrders)
    return () => {
      isMounted = false
      listeners.delete(setOrders)
    }
  }, [])

  return {
    orders,
    isLoading,
    getOrderById: orderStore.getOrderById,
    fetchOrderById: orderStore.fetchOrderById,
    createOrder: orderStore.createOrder,
    cancelOrder: orderStore.cancelOrder,
    staffCancelOrder: orderStore.staffCancelOrder,
    updateOrderStatus: orderStore.updateOrderStatus,
    reorderToCart: orderStore.reorderToCart,
  }
}
