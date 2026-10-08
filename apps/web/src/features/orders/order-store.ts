import { useState, useEffect } from 'react'
import { type Order, type OrderItem } from '../../lib/mock-data/orders'
import { cartStore } from '../cart/cart-store'


const STORAGE_KEY = 'persianpart_orders'

function getInitialState(): Order[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
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

import { api } from '../../lib/api-client'

export function mapDocToOrder(doc: any): Order {
  const now = new Date(doc.createdAt || Date.now())
  const persianDate = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`
  const normalizedStatus = doc.status === 'processing' ? 'preparing' : (doc.status || 'pending')

  const statusLabels: Record<string, string> = {
    pending: 'در انتظار بررسی',
    approved: 'تأیید شده',
    processing: 'در حال آماده‌سازی',
    preparing: 'در حال آماده‌سازی',
    ready: 'آماده تحویل',
    completed: 'تکمیل شده',
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

  const rawTimeline = Array.isArray(doc.timeline) && doc.timeline.length > 0 ? doc.timeline : [
    {
      title: 'ثبت سفارش',
      description: 'سفارش توسط خریدار در سامانه ثبت گردید.',
      timestamp: doc.createdAt || new Date().toISOString(),
      status: 'completed',
    },
  ]

  const timeline = rawTimeline.map((t: any, idx: number) => ({
    id: t.id || `tl-${idx}`,
    title: t.title || 'رویداد',
    description: t.description || '',
    timestamp: t.timestamp ? new Date(t.timestamp).toLocaleDateString('fa-IR') : persianDate,
    status: (t.status === 'completed' || t.status === 'approved' || idx === 0) ? ('completed' as const) : ('pending' as const),
  }))

  const userObj = typeof doc.user === 'object' && doc.user !== null ? doc.user : null

  return {
    id: String(doc.id),
    orderNumber: doc.orderNumber || `PP-${doc.id}`,
    date: persianDate,
    status: normalizedStatus as any,
    statusLabel: statusLabels[doc.status] || 'در انتظار بررسی',
    storeName: userObj?.companyName || 'بازرگانی دهقان (پرشین پارت)',
    customerName: userObj?.fullName || 'خریدار محترم',
    customerPhone: userObj?.phone || '',
    deliveryAddress: doc.deliveryAddress || userObj?.address || 'انبار مرکزی بازرگانی دهقان',
    deliveryMethod: 'باربری بین‌شهری / تیپاکس',
    notes: doc.notes || '',
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
    const orderNumber = payload.orderNumber || `PP-1403-${randomNum}`
    const now = new Date()
    const persianDate = `۱۴۰۳/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const newOrder: Order = {
      id: newId,
      orderNumber,
      date: persianDate,
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
          timestamp: persianDate,
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

  cancelOrder: (orderId: string): boolean => {
    const updated = currentOrders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: 'cancelled' as const,
          statusLabel: 'لغو شده',
          timeline: [
            ...order.timeline.filter((t) => t.status === 'completed'),
            {
              id: `t-cancel-${Date.now()}`,
              title: 'لغو سفارش',
              description: 'سفارش توسط خریدار لغو گردید.',
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
    reorderToCart: orderStore.reorderToCart,
  }
}
