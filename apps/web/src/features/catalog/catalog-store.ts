import { useState, useMemo, useEffect } from 'react'
import type { Product } from '../../lib/mock-data/products'
import { api } from '../../lib/api-client'

export type SortOption = 'default' | 'cheapest' | 'expensive' | 'newest' | 'oldest'

export interface FilterState {
  searchQuery: string
  selectedDimension: string | null
  selectedBrands: string[]
  selectedColors: string[]
  selectedFinishes: string[]
  selectedGrades: string[]
  selectedTags: string[]
  selectedCategory: string | null
  onlyInStock: boolean
  viewMode: 'grid' | 'list'
  sortBy: SortOption
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  selectedDimension: null,
  selectedBrands: [],
  selectedColors: [],
  selectedFinishes: [],
  selectedGrades: [],
  selectedTags: [],
  selectedCategory: null,
  onlyInStock: false,
  viewMode: 'grid',
  sortBy: 'default',
}

export function useCatalog() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [productsList, setProductsList] = useState<Product[]>([])
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false)

  // Fetch from live backend API on mount
  useEffect(() => {
    let isMounted = true
    api.catalog
      .list({ page: 1, limit: 100 })
      .then((res) => {
        if (isMounted) {
          if (res.items && res.items.length > 0) {
            const liveMapped: Product[] = res.items.map((item: any) => {
              const width = item.width || 60
              const height = item.height || 120
              const dimStr = `${width}×${height}`
              const brandName = typeof item.brand === 'object' && item.brand !== null ? item.brand.name : (item.brandName || 'پرشین پارت')
              const categoryName = typeof item.category === 'object' && item.category !== null ? item.category.name : (item.categoryName || 'عمومی')
              const price = item.finalCustomerPricePerSqm || item.basePricePerSqm || 1250000
              const coverUrl = item.cover?.url || (typeof item.cover === 'string' ? item.cover : '/assets/images/tile-sample-1.jpg')

              return {
                id: String(item.id),
                slug: item.slug || `product-${item.id}`,
                name: item.name,
                sku: item.sku,
                dimensions: { width, height },
                dimension: dimStr,
                brand: brandName,
                color: item.color || 'استاندارد',
                finish: (item.finish as any) || 'فابریک',
                grade: (item.grade as any) || 'اصلی (Genuine)',
                category: categoryName,
                finalCustomerPricePerSqm: price,
                pricePerM2: price,
                sqmPerCarton: item.sqmPerCarton || 1,
                areaPerCarton: item.sqmPerCarton || 1,
                piecesPerCarton: item.piecesPerCarton || 1,
                tilesPerCarton: item.piecesPerCarton || 1,
                cartonWeightKg: 28,
                inventorySqm: item.availability === 'out_of_stock' ? 0 : 500,
                stockCartons:
                  item.availability === 'out_of_stock'
                    ? 0
                    : Math.floor(500 / (item.sqmPerCarton || 1)),
                inStock: item.availability !== 'out_of_stock',
                stockStatus:
                  item.availability === 'out_of_stock'
                    ? 'out_of_stock'
                    : item.availability === 'limited'
                      ? 'low_stock'
                      : 'in_stock',
                description: item.richDescription || undefined,
                applications: ['خودرو سواری', 'سفارش عمده'],
                tags: Array.isArray(item.tags) ? item.tags.map((t: any) => typeof t === 'object' ? t.name : t) : [],
                images: [coverUrl],
                gallery: Array.isArray(item.gallery) ? item.gallery.map((g: any) => g.image?.url || g.image).filter(Boolean) : [],
              }
            })
            setProductsList(liveMapped)
          } else {
            setProductsList([])
          }
          setIsLiveConnected(true)
        }
      })
      .catch(() => {
        if (isMounted) {
          setProductsList([])
          setIsLiveConnected(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.searchQuery) count++
    if (filters.selectedDimension) count++
    count += filters.selectedBrands.length
    count += filters.selectedColors.length
    count += filters.selectedFinishes.length
    count += filters.selectedGrades.length
    count += filters.selectedTags.length
    if (filters.selectedCategory) count++
    if (filters.onlyInStock) count++
    if (filters.sortBy !== 'default') count++
    return count
  }, [filters])

  const filteredProducts = useMemo(() => {
    const list = productsList.filter((product) => {
      // Search query (matches name, SKU, brand, color, dimensions, tags)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim()
        const matchesName = product.name.toLowerCase().includes(query)
        const matchesSku = product.sku.toLowerCase().includes(query)
        const matchesBrand = product.brand.toLowerCase().includes(query)
        const matchesColor = product.color.toLowerCase().includes(query)
        const matchesDim = product.dimension.includes(query)
        const matchesTag = product.tags.some((t) => t.toLowerCase().includes(query))
        if (!matchesName && !matchesSku && !matchesBrand && !matchesColor && !matchesDim && !matchesTag) {
          return false
        }
      }

      // Dimensions (Strict single dimension match)
      if (
        filters.selectedDimension &&
        product.dimension !== filters.selectedDimension
      ) {
        return false
      }

      // Brands
      if (
        filters.selectedBrands.length > 0 &&
        !filters.selectedBrands.includes(product.brand)
      ) {
        return false
      }

      // Colors
      if (
        filters.selectedColors.length > 0 &&
        !filters.selectedColors.includes(product.color)
      ) {
        return false
      }

      // Finishes
      if (
        filters.selectedFinishes.length > 0 &&
        !filters.selectedFinishes.includes(product.finish)
      ) {
        return false
      }

      // Grades
      if (
        filters.selectedGrades.length > 0 &&
        !filters.selectedGrades.includes(product.grade)
      ) {
        return false
      }

      // Tags
      if (
        filters.selectedTags.length > 0 &&
        !filters.selectedTags.some((tag) => product.tags.includes(tag))
      ) {
        return false
      }

      // Category
      if (
        filters.selectedCategory &&
        product.category !== filters.selectedCategory
      ) {
        return false
      }

      // Only in stock
      if (filters.onlyInStock && !product.inStock) {
        return false
      }

      return true
    })

    // Sorting
    switch (filters.sortBy) {
      case 'cheapest':
        return [...list].sort(
          (a, b) => a.finalCustomerPricePerSqm - b.finalCustomerPricePerSqm
        )
      case 'expensive':
        return [...list].sort(
          (a, b) => b.finalCustomerPricePerSqm - a.finalCustomerPricePerSqm
        )
      case 'newest':
        return [...list].reverse()
      default:
        return list
    }
  }, [filters, productsList])

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const toggleArrayFilter = (
    key:
      | 'selectedBrands'
      | 'selectedColors'
      | 'selectedFinishes'
      | 'selectedGrades'
      | 'selectedTags',
    value: string
  ) => {
    setFilters((prev) => {
      const arr = prev[key]
      const exists = arr.includes(value)
      return {
        ...prev,
        [key]: exists ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  return {
    products: filteredProducts,
    allProducts: productsList,
    filters,
    activeFilterCount,
    isLiveConnected,
    setFilter,
    toggleArrayFilter,
    resetFilters,
  }
}
