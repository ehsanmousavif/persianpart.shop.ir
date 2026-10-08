import { useState, useMemo } from 'react'
import { MOCK_PRODUCTS } from '../../lib/mock-data/products'

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
    const list = MOCK_PRODUCTS.filter((product) => {
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

      // Dimensions (Strict single dimension match: each product belongs to one dimension)
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
      if (filters.selectedCategory && product.category !== filters.selectedCategory) {
        return false
      }

      // In stock
      if (filters.onlyInStock && (!product.inStock || product.stockStatus === 'out_of_stock')) {
        return false
      }

      return true
    })

    // Sorting: ارزان‌ترین، گران‌ترین، جدیدترین، قدیمی‌ترین
    if (filters.sortBy === 'cheapest') {
      return [...list].sort((a, b) => a.finalCustomerPricePerSqm - b.finalCustomerPricePerSqm)
    } else if (filters.sortBy === 'expensive') {
      return [...list].sort((a, b) => b.finalCustomerPricePerSqm - a.finalCustomerPricePerSqm)
    } else if (filters.sortBy === 'newest') {
      return [...list].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
    } else if (filters.sortBy === 'oldest') {
      return [...list].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateA - dateB
      })
    }

    return list
  }, [filters])

  const resetFilters = () => setFilters({ ...DEFAULT_FILTERS, viewMode: filters.viewMode })

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
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
    allProducts: MOCK_PRODUCTS,
    filters,
    activeFilterCount,
    setFilter,
    toggleArrayFilter,
    resetFilters,
  }
}
