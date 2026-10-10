import { useState, useEffect, useCallback } from 'react'
import { api, type CatalogProduct } from '../lib/api-client'

export function useCatalog(filters?: {
  search?: string
  categoryId?: string
  brandId?: string
  color?: string
  finish?: string
  grade?: string
  page?: number
  limit?: number
}) {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [res] = await Promise.all([
        api.catalog.list(filters || {}),
        new Promise((resolve) => setTimeout(resolve, 1000)), // 1s visible skeleton delay
      ])
      setProducts(res.items)
      setTotal(res.total)
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت کاتالوگ محصولات')
    } finally {
      setIsLoading(false)
    }
  }, [
    filters?.search,
    filters?.categoryId,
    filters?.brandId,
    filters?.color,
    filters?.finish,
    filters?.grade,
    filters?.page,
    filters?.limit,
  ])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  return {
    products,
    total,
    isLoading,
    error,
    refetch: fetchCatalog,
  }
}

export function useProduct(productId: string | null) {
  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!productId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.catalog.getById({ id: productId })
      setProduct(res)
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت مشخصات محصول')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  }
}

export function useCartonCalculation() {
  const [isLoading, setIsLoading] = useState(false)

  const calculate = async (productId: string, requestedSqm: number) => {
    setIsLoading(true)
    try {
      return await api.catalog.calculateCartons({ productId, requestedSqm })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    calculate,
    isLoading,
  }
}
