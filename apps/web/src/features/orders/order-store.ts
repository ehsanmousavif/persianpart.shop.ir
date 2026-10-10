import { useState, useEffect } from 'react'
import { type Order, type OrderItem, type TimelineStep } from '../../lib/mock-data/orders'
import { cartStore } from '../cart/cart-store'
import { api } from '../../lib/api-client'
import {
  formatPersianDate,
  formatPersianDateTime,
  formatPersianTimelineTs,
} from '../../lib/utils/date'

const STORAGE_KEY = 'persianpart_orders'

function getInitialState(): Order[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return parsed.map((o) => {
          // If stored order had Gregorian date (e.g. starting with 202), convert to Shamsi
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

export function buildFullOrderTimeline(doc: any, persianDate: string): TimelineStep[] {
  const status = doc.status || 'pending'
  const rawEvents = Array.isArray(doc.timeline) ? doc.timeline : []

  const findEvent = (keywords: string[]) => {
    return rawEvents.find((e: any) =>
      keywords.some(
        (k) =>
          (e.title || '').includes(k) ||
          (e.status || '') === k
      )
    )
  }

  const formatTs = (ts?: string) => {
    if (!ts) return undefined
    return formatPersianTimelineTs(ts, persianDate)
  }

  const isCancelled =
    status === 'cancelled' ||
    status === 'cancelled_by_customer' ||
    status === 'cancelled_by_admin'

  const STAGES = [
    {
      id: 'step-1',
      key: 'pending',
      keywords: ['ثبت', 'pending'],
      title: 'ثبت سفارش خریدار',
      desc: 'سفارش توسط خریدار در سامانه با موفقیت ثبت شد.',
    },
    {
      id: 'step-2',
      key: 'checking',
      keywords: ['بررسی', 'checking'],
      title: 'در حال بررسی واحد بازرگانی',
      desc: 'ارزیابی مالی، استعلام سهمیه و بررسی شرایط توسط واحد بازرگانی.',
    },
    {
      id: 'step-3',
      key: 'approved',
      keywords: ['تأیید', 'تایید', 'approved'],
      title: 'تأیید واحد بازرگانی',
      desc: 'تأیید مالی و صدور حواله خروج از انبار توسط مدیریت بازرگانی.',
    },
    {
      id: 'step-4',
      key: 'preparing',
      keywords: ['آماده‌سازی', 'بارگیری', 'preparing', 'processing'],
      title: 'در حال آماده‌سازی و بارگیری انبار',
      desc: 'تفکیک، بسته‌بندی، پالت‌بندی و آماده‌سازی قطعات در انبار مکانیزه.',
    },
    {
      id: 'step-5',
      key: 'shipping',
      keywords: ['ارسال', 'حمل', 'بارنامه', 'shipping', 'ready'],
      title: 'در حال ارسال و صدور بارنامه',
      desc: 'صدور بارنامه رسمی و هماهنگی ناوگان حمل‌ونقل و باربری بین‌شهری.',
    },
    {
      id: 'step-6',
      key: 'completed',
      keywords: ['تکمیل', 'تحویل نهایی', 'completed'],
      title: 'تکمیل شده و تحویل نهایی',
      desc: 'تخلیه بار در نشانی مقصد و تحویل قطعی سفارش با تأیید فاکتور.',
    },
  ]

  const statusLevelMap: Record<string, number> = {
    pending: 1,
    checking: 2,
    approved: 3,
    preparing: 4,
    processing: 4,
    shipping: 5,
    ready: 5,
    completed: 6,
  }

  if (isCancelled) {
    const cancelTitle =
      status === 'cancelled_by_customer'
        ? 'لغو سفارش توسط خریدار'
        : status === 'cancelled_by_admin'
        ? 'لغو سفارش توسط مدیریت / بازرگانی'
        : 'لغو سفارش'

    const cancelDesc =
      status === 'cancelled_by_customer'
        ? doc.notes || 'سفارش در مهلت مقرر توسط خریدار لغو گردید و موجودی به انبار بازگردانده شد.'
        : status === 'cancelled_by_admin'
        ? doc.notes || 'سفارش توسط مدیریت لغو و موجودی کالا به انبار بازگردانی گردید.'
        : doc.notes || 'سفارش لغو شد و موجودی به انبار بازگردانده شد.'

    const regEvent = findEvent(['ثبت', 'pending'])
    const cancelEvent = findEvent(['لغو', 'cancelled'])

    return [
      {
        id: 'step-1',
        title: 'ثبت سفارش خریدار',
        description: regEvent?.description || 'سفارش در سامانه ثبت گردید.',
        timestamp: formatTs(regEvent?.timestamp || doc.createdAt) || persianDate,
        status: 'completed',
      },
      {
        id: 'step-cancel',
        title: cancelTitle,
        description: cancelEvent?.description || cancelDesc,
        timestamp: formatTs(cancelEvent?.timestamp || doc.updatedAt) || persianDate,
        status: 'cancelled',
      },
    ]
  }

  const currentLevel = statusLevelMap[status] ?? 1

  return STAGES.map((stage, idx) => {
    const stageLevel = idx + 1
    const matchedEvent = findEvent(stage.keywords)

    let stepStatus: 'completed' | 'current' | 'pending' = 'pending'
    let stepTimestamp = matchedEvent?.timestamp ? formatTs(matchedEvent.timestamp) : undefined

    if (stageLevel < currentLevel || (currentLevel === 6 && stageLevel <= 6)) {
      stepStatus = 'completed'
      if (!stepTimestamp) {
        stepTimestamp = stageLevel === 1 ? formatTs(doc.createdAt) : undefined
      }
    } else if (stageLevel === currentLevel) {
      stepStatus = 'current'
      if (!stepTimestamp) {
        stepTimestamp = 'موقعیت فعلی'
      }
    } else {
      stepStatus = 'pending'
    }

    return {
      id: stage.id,
      title: stage.title,
      description: matchedEvent?.description || stage.desc,
      timestamp: stepTimestamp,
      status: stepStatus,
    }
  })
}

export function mapDocToOrder(doc: any): Order {
  const createdAt = doc.createdAt || new Date().toISOString()
  const persianDate = formatPersianDate(createdAt)
  const normalizedStatus = doc.status === 'processing' ? 'preparing' : (doc.status || 'pending')

  const statusLabels: Record<string, string> = {
    pending: 'در انتظار تأیید اولیه',
    checking: 'در حال بررسی واحد بازرگانی',
    approved: 'تأیید شده بازرگانی',
    processing: 'در حال آماده‌سازی و بارگیری',
    preparing: 'در حال آماده‌سازی و بارگیری',
    shipping: 'در حال ارسال و بارنامه',
    ready: 'آماده تحویل و بارنامه',
    completed: 'تکمیل شده و تحویل نهایی',
    cancelled_by_customer: 'لغو شده توسط خریدار',
    cancelled_by_admin: 'لغو شده توسط مدیریت / بازرگانی',
    cancelled: 'لغو شده',
  }

  const items: OrderItem[] = (doc.items || []).map((i: any) => {
    const prod = typeof i.product === 'object' && i.product !== null ? i.product : null
    const width = prod?.width || 60
    const height = prod?.height || 120
    const coverUrl = prod?.cover?.url || (typeof prod?.cover === 'string' ? prod.cover : '/assets/images/tile-sample-1.jpg')
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

  const timeline = buildFullOrderTimeline(doc, persianDate)

  const userObj = typeof doc.user === 'object' && doc.user !== null ? doc.user : null

  return {
    id: String(doc.id),
    orderNumber: doc.orderNumber || `PP-${doc.id}`,
    date: persianDate,
    createdAt,
    status: normalizedStatus as any,
    statusLabel: statusLabels[doc.status] || 'در انتظار بررسی',
    storeName: userObj?.companyName || 'بازرگانی دهقان (پرشین پارت)',
    customerName: userObj?.fullName || 'خریدار محترم',
    customerPhone: userObj?.phone || '',
    deliveryAddress: doc.deliveryAddress || userObj?.address || 'انبار مرکزی بازرگانی دهقان',
    deliveryMethod: 'باربری بین‌شهری / تیپاکس',
    notes: doc.notes || '',
    cancellationDeadline: doc.cancellationDeadline || (doc.createdAt ? new Date(new Date(doc.createdAt).getTime() + 10 * 60 * 1000).toISOString() : undefined),
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
    const persianDateTime = formatPersianDateTime(now)

    const newOrder: Order = {
      id: newId,
      orderNumber,
      date: persianDate,
      createdAt: isoString,
      cancellationDeadline: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
      status: 'pending',
      statusLabel: 'در انتظار بررسی',
      storeName: 'بازرگانی دهقان (پرشین پارت تهران)',
      customerName: 'آرش دهقان',
      customerPhone: '۰۹۱۲۳۴۵۶۷۸۹',
      deliveryAddress: payload.deliveryAddress,
      deliveryMethod: 'باربری خاور سرپوشیده اختصاصی',
      notes: payload.notes,
      items: payload.items,
      subtotal: payload.subtotal,
      discountAmount: payload.discountAmount,
      taxAmount: payload.taxAmount,
      finalTotal: payload.finalTotal,
      timeline: [
        {
          id: 't-1',
          title: 'ثبت سفارش',
          description: 'سفارش توسط خریدار در سامانه ثبت گردید و در انتظار تأیید بازرگانی است.',
          timestamp: persianDateTime,
          status: 'completed',
        },
        {
          id: 't-2',
          title: 'تأیید واحد بازرگانی',
          description: 'بررسی اعتبار تجاری و تخصیص سهمیه از خط تولید.',
          status: 'current',
        },
        {
          id: 't-3',
          title: 'در حال آماده‌سازی و بارگیری',
          description: 'پالت‌بندی و بارگیری در انبار مکانیزه کارخانه.',
          status: 'pending',
        },
        {
          id: 't-4',
          title: 'آماده تحویل / صدور بارنامه',
          description: 'اعزام خودرو و صدور حواله الکترونیکی خروج.',
          status: 'pending',
        },
        {
          id: 't-5',
          title: 'تکمیل شده و تحویل نهایی',
          description: 'تخلیه بار در انبار خریدار و تسویه نهایی.',
          status: 'pending',
        },
      ],
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
        return {
          ...order,
          status: 'cancelled_by_customer' as const,
          statusLabel: 'لغو شده توسط خریدار',
          timeline: [
            ...order.timeline.filter((t) => t.status === 'completed'),
            {
              id: `t-cancel-${Date.now()}`,
              title: 'لغو سفارش توسط خریدار',
              description: reason ? `لغو در مهلت ۱۰ دقیقه: ${reason}` : 'سفارش در مهلت ۱۰ دقیقه‌ای توسط خریدار لغو گردید و موجودی به انبار بازگردانی شد.',
              timestamp: 'هم‌اکنون',
              status: 'cancelled' as const,
            },
          ],
        }
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
        return {
          ...order,
          status: 'cancelled_by_admin' as const,
          statusLabel: 'لغو شده توسط مدیریت / بازرگانی',
          timeline: [
            ...order.timeline.filter((t) => t.status === 'completed'),
            {
              id: `t-staff-cancel-${Date.now()}`,
              title: 'لغو سفارش توسط مدیریت / بازرگانی',
              description: reason || 'سفارش توسط مدیریت لغو شد و موجودی به انبار بازگردانی گردید.',
              timestamp: 'هم‌اکنون',
              status: 'cancelled' as const,
            },
          ],
        }
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

  useEffect(() => {
    orderStore.syncFromApi()
    listeners.add(setOrders)
    return () => {
      listeners.delete(setOrders)
    }
  }, [])

  return {
    orders,
    getOrderById: orderStore.getOrderById,
    fetchOrderById: orderStore.fetchOrderById,
    createOrder: orderStore.createOrder,
    cancelOrder: orderStore.cancelOrder,
    staffCancelOrder: orderStore.staffCancelOrder,
    updateOrderStatus: orderStore.updateOrderStatus,
    reorderToCart: orderStore.reorderToCart,
  }
}
