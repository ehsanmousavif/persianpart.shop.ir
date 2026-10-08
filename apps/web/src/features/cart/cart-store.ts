import { useState, useEffect } from 'react'
import type { Product } from '../../lib/mock-data/products'
import { calculateCartonRequirement } from '../../lib/utils/math'

export interface CartItem {
  productId: string
  name: string
  slug: string
  sku: string
  dimension: string
  image: string
  unitPrice: number // Final customer price in Toman/m²
  oldUnitPrice?: number
  sqmPerCarton: number // Authoritative value
  areaPerCarton: number // backward compatibility
  requestedArea: number
  cartonCount: number // System-calculated ceil
  deliverableArea: number // cartonCount * sqmPerCarton
  totalPrice: number // deliverableArea * unitPrice
  stockCartons: number
  inventorySqm: number
  statusWarning?: 'low_stock' | 'out_of_stock' | 'price_changed'
}

export type CartDemoMode = 'normal' | 'low_stock' | 'out_of_stock' | 'price_changed' | 'empty'

interface CartState {
  items: CartItem[]
  demoMode: CartDemoMode
}

const STORAGE_KEY = 'persianpart_cart_v2'

const INITIAL_CART_ITEMS: CartItem[] = [
  {
    productId: 'prod-9',
    name: 'پرسلان ماربل سفید کالیبره ۳۰×۹۰',
    slug: 'white-marble-30x90',
    sku: 'PP-WMR-3090-POL',
    dimension: '30×90',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80',
    unitPrice: 500000,
    sqmPerCarton: 7.2,
    areaPerCarton: 7.2,
    requestedArea: 35.0,
    cartonCount: 5,
    deliverableArea: 36.0,
    totalPrice: 18000000,
    stockCartons: 10,
    inventorySqm: 72.0,
  },
  {
    productId: 'prod-1',
    name: 'پرسلان کلکته گلد سوپر پولیش',
    slug: 'calacatta-gold-60120-polish',
    sku: 'PP-CAL-6012-POL',
    dimension: '60×120',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80',
    unitPrice: 540000,
    sqmPerCarton: 1.44,
    areaPerCarton: 1.44,
    requestedArea: 20.0,
    cartonCount: 14,
    deliverableArea: 20.16,
    totalPrice: 10886400,
    stockCartons: 320,
    inventorySqm: 460.8,
  },
]

function getInitialState(): CartState {
  if (typeof window === 'undefined') {
    return { items: INITIAL_CART_ITEMS, demoMode: 'normal' }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // fallback
  }
  return { items: INITIAL_CART_ITEMS, demoMode: 'normal' }
}

let currentState: CartState = getInitialState()
const listeners = new Set<(state: CartState) => void>()

function broadcast(nextState: CartState) {
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

export const cartStore = {
  getState: () => currentState,

  addItem: (product: Product, requestedArea: number) => {
    cartStore.setProductQuantity(product, requestedArea)
  },

  setProductQuantity: (product: Product, requestedArea: number) => {
    if (requestedArea <= 0) {
      cartStore.removeItem(product.id)
      return
    }

    const calc = calculateCartonRequirement(
      requestedArea,
      product.sqmPerCarton,
      product.finalCustomerPricePerSqm,
      product.inventorySqm
    )

    const existingIndex = currentState.items.findIndex(
      (item) => item.productId === product.id
    )

    const updatedItems = [...currentState.items]

    if (existingIndex > -1) {
      const existing = updatedItems[existingIndex]!
      updatedItems[existingIndex] = {
        ...existing,
        requestedArea: calc.requestedArea,
        cartonCount: calc.cartonCount,
        deliverableArea: calc.deliverableArea,
        totalPrice: calc.totalPrice,
      }
    } else {
      updatedItems.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        dimension: product.dimension,
        image: product.images[0] ?? '',
        unitPrice: product.finalCustomerPricePerSqm,
        sqmPerCarton: product.sqmPerCarton,
        areaPerCarton: product.sqmPerCarton,
        requestedArea: calc.requestedArea,
        cartonCount: calc.cartonCount,
        deliverableArea: calc.deliverableArea,
        totalPrice: calc.totalPrice,
        stockCartons: product.stockCartons,
        inventorySqm: product.inventorySqm,
      })
    }

    broadcast({ ...currentState, items: updatedItems })
  },

  updateCartonCount: (productId: string, newCount: number) => {
    if (newCount <= 0) {
      cartStore.removeItem(productId)
      return
    }

    const updatedItems = currentState.items.map((item) => {
      if (item.productId === productId) {
        const deliverableArea = Math.round(newCount * item.sqmPerCarton * 100) / 100
        const totalPrice = Math.round(deliverableArea * item.unitPrice)
        return {
          ...item,
          cartonCount: newCount,
          deliverableArea,
          totalPrice,
        }
      }
      return item
    })

    broadcast({ ...currentState, items: updatedItems })
  },

  removeItem: (productId: string) => {
    const updatedItems = currentState.items.filter(
      (item) => item.productId !== productId
    )
    broadcast({ ...currentState, items: updatedItems })
  },

  clearCart: () => {
    broadcast({ ...currentState, items: [] })
  },

  resetCart: () => {
    broadcast({ items: INITIAL_CART_ITEMS, demoMode: 'normal' })
  },

  setDemoMode: (mode: CartDemoMode) => {
    let items = [...currentState.items]

    if (items.length === 0 && mode !== 'empty') {
      items = [...INITIAL_CART_ITEMS]
    }

    if (mode === 'normal') {
      items = items.map((i) => ({ ...i, statusWarning: undefined, oldUnitPrice: undefined }))
    } else if (mode === 'low_stock') {
      if (items[0]) {
        items[0] = {
          ...items[0],
          statusWarning: 'low_stock',
          stockCartons: 2,
          inventorySqm: 14.4,
        }
      }
    } else if (mode === 'out_of_stock') {
      if (items[0]) {
        items[0] = {
          ...items[0],
          statusWarning: 'out_of_stock',
          stockCartons: 0,
          inventorySqm: 0,
        }
      }
    } else if (mode === 'price_changed') {
      if (items[0]) {
        items[0] = {
          ...items[0],
          statusWarning: 'price_changed',
          oldUnitPrice: items[0].unitPrice,
          unitPrice: Math.round(items[0].unitPrice * 1.15),
          totalPrice: Math.round(items[0].deliverableArea * items[0].unitPrice * 1.15),
        }
      }
    } else if (mode === 'empty') {
      items = []
    }

    broadcast({ items, demoMode: mode })
  },
}

export function useCart() {
  const [state, setState] = useState<CartState>(cartStore.getState())

  useEffect(() => {
    listeners.add(setState)
    return () => {
      listeners.delete(setState)
    }
  }, [])

  const totalCartons = state.items.reduce((sum, item) => sum + item.cartonCount, 0)
  const totalArea = Math.round(state.items.reduce((sum, item) => sum + item.deliverableArea, 0) * 100) / 100
  const subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0)
  const discountAmount = Math.round(subtotal * 0.05) // 5% commercial discount
  const taxableAmount = subtotal - discountAmount
  const taxAmount = Math.round(taxableAmount * 0.1) // 10% VAT
  const finalTotal = taxableAmount + taxAmount
  const itemCount = state.items.length

  const hasBlockingIssues = state.items.some(
    (item) => item.statusWarning === 'out_of_stock'
  )

  const isProductInCart = (productId: string) => {
    return state.items.some((item) => item.productId === productId)
  }

  const getProductCartItem = (productId: string) => {
    return state.items.find((item) => item.productId === productId)
  }

  return {
    items: state.items,
    demoMode: state.demoMode,
    itemCount,
    totalCartons,
    totalArea,
    subtotal,
    discountAmount,
    taxAmount,
    finalTotal,
    hasBlockingIssues,
    addItem: cartStore.addItem,
    setProductQuantity: cartStore.setProductQuantity,
    updateCartonCount: cartStore.updateCartonCount,
    removeItem: cartStore.removeItem,
    clearCart: cartStore.clearCart,
    resetCart: cartStore.resetCart,
    setDemoMode: cartStore.setDemoMode,
    isProductInCart,
    getProductCartItem,
  }
}
