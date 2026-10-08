import { useState, useEffect } from 'react'
import { MOCK_ORDERS, type Order, type OrderItem } from '../../lib/mock-data/orders'
import { cartStore } from '../cart/cart-store'
import { MOCK_PRODUCTS } from '../../lib/mock-data/products'

const STORAGE_KEY = 'persianpart_orders'

function getInitialState(): Order[] {
  if (typeof window === 'undefined') {
    return MOCK_ORDERS
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // fallback
  }
  return MOCK_ORDERS
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

export const orderStore = {
  getOrders: () => currentOrders,
  getOrderById: (id: string) => currentOrders.find((o) => o.id === id || o.orderNumber === id),

  createOrder: (payload: {
    items: OrderItem[]
    subtotal: number
    discountAmount: number
    taxAmount: number
    finalTotal: number
    deliveryAddress: string
    notes?: string
  }): Order => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const newId = `ord-${randomNum}`
    const orderNumber = `PP-1403-${randomNum}`
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

    // Populate cart with current product specs
    order.items.forEach((item) => {
      const liveProduct = MOCK_PRODUCTS.find((p) => p.id === item.productId)
      if (liveProduct) {
        if (!liveProduct.inStock) {
          warnings.push(`محصول «${liveProduct.name}» در حال حاضر در انبار ناموجود است.`)
        } else if (liveProduct.pricePerM2 !== item.unitPrice) {
          warnings.push(
            `قیمت محصول «${liveProduct.name}» تغییر کرده است (قبلی: ${item.unitPrice.toLocaleString('fa-IR')} → جدید: ${liveProduct.pricePerM2.toLocaleString('fa-IR')})`
          )
        }
        cartStore.addItem(liveProduct, item.requestedArea)
      }
    })

    return { success: true, warnings }
  },
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(orderStore.getOrders())

  useEffect(() => {
    listeners.add(setOrders)
    return () => {
      listeners.delete(setOrders)
    }
  }, [])

  return {
    orders,
    getOrderById: orderStore.getOrderById,
    createOrder: orderStore.createOrder,
    cancelOrder: orderStore.cancelOrder,
    reorderToCart: orderStore.reorderToCart,
  }
}
