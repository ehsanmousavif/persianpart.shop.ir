import { useState, useMemo, useEffect } from 'react'
import type { Product } from '../../lib/mock-data/products'
import { api } from '../../lib/api-client'
import { plansStore } from '../plans/plans-store'
import { toPersianDigits } from '../../lib/utils/currency'
import { useQueryStates } from 'nuqs'
import { catalogFilterParsers, type SortOption } from './catalog-filters'
export type { SortOption }

export function resolveMediaUrl(media: any): string {
  if (!media) return ''
  if (typeof media === 'string') {
    if (media.startsWith('http://') || media.startsWith('https://') || media.startsWith('/')) {
      return media
    }
    if (media.includes('.')) {
      return `/api/media/file/${media}`
    }
    return ''
  }
  if (typeof media === 'object') {
    if (media.url && typeof media.url === 'string') return media.url
    if (media.thumbnailURL && typeof media.thumbnailURL === 'string') return media.thumbnailURL
    if (media.filename && typeof media.filename === 'string') return `/api/media/file/${media.filename}`
    if (media.image) return resolveMediaUrl(media.image)
  }
  return ''
}

export function formatGrade(rawGrade?: string): string {
  if (!rawGrade) return 'درجه ۱'
  const gradeStr = String(rawGrade).trim()
  const mapping: Record<string, string> = {
    grade_1: 'درجه ۱',
    grade_2: 'درجه ۲',
    grade_3: 'درجه ۳',
    grade_4: 'درجه ۴',
    grade: 'درجه',
    '1': 'درجه ۱',
    '2': 'درجه ۲',
    '3': 'درجه ۳',
    '4': 'درجه ۴',
    'درجه 1': 'درجه ۱',
    'درجه 2': 'درجه ۲',
    'درجه 3': 'درجه ۳',
    'درجه 4': 'درجه ۴',
    'اصلی (Genuine)': 'درجه ۱ (اصلی)',
  }
  if (mapping[gradeStr]) return mapping[gradeStr]
  if (gradeStr.startsWith('grade_')) {
    const num = gradeStr.replace('grade_', '')
    return `درجه ${toPersianDigits(num)}`
  }
  return gradeStr
}

export type ViewMode = 'list' | 'grid-2' | 'grid-3' | 'compact'

export interface FilterState {
  searchQuery: string
  selectedDimension: string | null
  selectedBrands: string[]
  selectedColors: string[]
  selectedGrades: string[]
  selectedTags: string[]
  selectedCategory: string | null
  onlyInStock: boolean
  viewMode: ViewMode
  sortBy: SortOption
}

export function useCatalog() {
  const [queryFilters, setQueryFilters] = useQueryStates(catalogFilterParsers, { shallow: true })
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [productsList, setProductsList] = useState<Product[]>([])
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [dimensions, setDimensions] = useState<string[]>([
    '30×90',
    '60×120',
    '80×160',
    '100×100',
    '120×240',
    '60×60',
    '30×60',
    '20×120',
  ])

  const filters: FilterState = useMemo(() => ({
    searchQuery: queryFilters.q,
    selectedDimension: queryFilters.dimension,
    selectedBrands: queryFilters.brands,
    selectedColors: queryFilters.colors,
    selectedGrades: queryFilters.grades,
    selectedTags: queryFilters.tags,
    selectedCategory: queryFilters.category,
    onlyInStock: queryFilters.inStock,
    viewMode,
    sortBy: queryFilters.sort,
  }), [queryFilters, viewMode])

  // Fetch dimensions from live CMS API
  useEffect(() => {
    let isMounted = true
    api.catalog.dimensions({ onlyActive: true })
      .then((dims: any) => {
        if (isMounted && Array.isArray(dims) && dims.length > 0) {
          const list = dims.map((d: any) => d.name || `${d.width}×${d.height}`)
          setDimensions(Array.from(new Set(list)))
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch from live backend API on mount with 1-second delay to display skeleton
  useEffect(() => {
    let isMounted = true
    Promise.all([
      api.catalog.list({ page: 1, limit: 100 }),
      new Promise((resolve) => setTimeout(resolve, 1000)), // 1s visible skeleton delay
    ])
      .then(([res]) => {
        if (isMounted) {
          if (res.items && res.items.length > 0) {
            const liveMapped: Product[] = res.items.map((item: any) => {
              const dimObj = typeof item.dimension === 'object' ? item.dimension : null
              const width = dimObj?.width || item.width || 60
              const height = dimObj?.height || item.height || 120
              const dimStr = dimObj?.name || `${width}×${height}`
              const brandName = typeof item.brand === 'object' && item.brand !== null ? item.brand.name : (item.brandName || 'پرشین پارت')
              const categoryName = typeof item.category === 'object' && item.category !== null ? item.category.name : (item.categoryName || 'عمومی')
              const basePrice = item.finalCustomerPricePerSqm || item.basePricePerSqm || 1250000
              const rawGallery = Array.isArray(item.gallery) ? item.gallery : []
              const galleryUrls = rawGallery
                .map((g: any) => resolveMediaUrl(g?.image || g))
                .filter(Boolean)

              const rawCoverUrl = resolveMediaUrl(item.cover)
              const primaryImage = rawCoverUrl || galleryUrls[0] || '/assets/images/placeholder.svg'
              const imagesList = [primaryImage, ...galleryUrls.filter((u: string) => u !== primaryImage)]

              // Check if any active product_discount plan covers this product
              const activeDiscountPlans = plansStore
                .getPlans()
                .filter((p) => (p.status === 'active' || p.isActive) && p.type === 'product_discount')

              const matchedPlan = activeDiscountPlans.find(
                (p) =>
                  p.productIds.includes(String(item.id)) ||
                  p.productIds.includes(`prod-${item.id}`) ||
                  p.productIds.includes(item.slug)
              )

              let finalPrice = basePrice
              let discountPercent: number | undefined = undefined
              let originalPricePerSqm: number | undefined = undefined
              let discountPlanTitle: string | undefined = undefined

              if (matchedPlan) {
                discountPercent = matchedPlan.discountPercent || 10
                originalPricePerSqm = basePrice
                finalPrice = Math.round(basePrice * (1 - discountPercent / 100))
                discountPlanTitle = matchedPlan.title
              }

              return {
                id: String(item.id),
                slug: item.slug || `product-${item.id}`,
                name: item.name,
                sku: item.sku,
                dimensions: { width, height },
                dimension: dimStr,
                brand: brandName,
                color: item.color || 'استاندارد',
                grade: formatGrade(item.grade) as any,
                category: categoryName,
                finalCustomerPricePerSqm: finalPrice,
                pricePerM2: finalPrice,
                originalPricePerSqm,
                discountPercent,
                discountPlanTitle,
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
                images: imagesList,
                gallery: galleryUrls.length > 0 ? galleryUrls : [primaryImage],
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
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
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
    setQueryFilters(null)
  }

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    switch (key) {
      case 'searchQuery':
        setQueryFilters({ q: (value as string) || null })
        break
      case 'selectedDimension':
        setQueryFilters({ dimension: (value as string | null) || null })
        break
      case 'selectedBrands':
        setQueryFilters({ brands: (value as string[]).length > 0 ? (value as string[]) : null })
        break
      case 'selectedColors':
        setQueryFilters({ colors: (value as string[]).length > 0 ? (value as string[]) : null })
        break
      case 'selectedGrades':
        setQueryFilters({ grades: (value as string[]).length > 0 ? (value as string[]) : null })
        break
      case 'selectedTags':
        setQueryFilters({ tags: (value as string[]).length > 0 ? (value as string[]) : null })
        break
      case 'selectedCategory':
        setQueryFilters({ category: (value as string | null) || null })
        break
      case 'onlyInStock':
        setQueryFilters({ inStock: value ? true : null })
        break
      case 'viewMode':
        setViewMode(value as ViewMode)
        break
      case 'sortBy':
        setQueryFilters({ sort: (value as SortOption) === 'default' ? null : (value as SortOption) })
        break
    }
  }

  const toggleArrayFilter = (
    key:
      | 'selectedBrands'
      | 'selectedColors'
      | 'selectedGrades'
      | 'selectedTags',
    value: string
  ) => {
    const map: Record<typeof key, 'brands' | 'colors' | 'grades' | 'tags'> = {
      selectedBrands: 'brands',
      selectedColors: 'colors',
      selectedGrades: 'grades',
      selectedTags: 'tags',
    }
    const queryKey = map[key]
    const currentArr = queryFilters[queryKey] || []
    const exists = currentArr.includes(value)
    const nextArr = exists ? currentArr.filter((v) => v !== value) : [...currentArr, value]
    setQueryFilters({ [queryKey]: nextArr.length > 0 ? nextArr : null })
  }

  return {
    products: filteredProducts,
    allProducts: productsList,
    dimensions,
    filters,
    isLoading,
    activeFilterCount,
    isLiveConnected,
    setFilter,
    toggleArrayFilter,
    resetFilters,
  }
}
