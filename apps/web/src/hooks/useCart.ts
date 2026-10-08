import { useState, useEffect, useCallback } from 'react'
import { api, type ValidateCartOutput } from '../lib/api-client'

export interface CartItemDraft {
  productId: string
  requestedSqm: number
}

const CART_STORAGE_KEY = 'persianpart_cart'

export function useCart() {
  const [items, setItems] = useState<CartItemDraft[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY)
        return saved ? JSON.parse(saved) : []
      } catch {
        return []
      }
    }
    return []
  })

  const [validation, setValidation] = useState<ValidateCartOutput | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items])

  // Validate cart against server pricing engine
  const validateCart = useCallback(async () => {
    if (items.length === 0) {
      setValidation(null)
      return
    }

    setIsValidating(true)
    try {
      const res = await api.order.pricing.validateCart({ items })
      setValidation(res)
    } catch {
      setValidation(null)
    } finally {
      setIsValidating(false)
    }
  }, [items])

  useEffect(() => {
    validateCart()
  }, [validateCart])

  const addItem = (productId: string, requestedSqm: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, requestedSqm: i.requestedSqm + requestedSqm } : i
        )
      }
      return [...prev, { productId, requestedSqm }]
    })
  }

  const updateItemQuantity = (productId: string, requestedSqm: number) => {
    if (requestedSqm <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, requestedSqm } : i))
    )
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const clearCart = () => {
    setItems([])
    setValidation(null)
  }

  return {
    items,
    validation,
    isValidating,
    totalAmount: validation?.totalAmount || 0,
    totalSqm: validation?.totalSqm || 0,
    totalCartons: validation?.totalCartons || 0,
    isValid: validation?.isValid ?? false,
    errorReasons: validation?.errorReasons || [],
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    refreshValidation: validateCart,
  }
}
