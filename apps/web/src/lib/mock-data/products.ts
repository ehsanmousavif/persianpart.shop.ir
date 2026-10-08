export interface ProductDimensions {
  width: number
  height: number
}

export interface Product {
  id: string
  slug: string
  name: string
  sku: string
  dimensions: ProductDimensions
  dimension: string
  brand: string
  color: string
  finish: 'پولیش' | 'مات' | 'براق' | 'شوگر' | 'رستیک'
  grade: 'درجه ۱' | 'درجه ۲' | 'صادراتی'
  category: 'پرسلان کف' | 'اسلب پرسلان' | 'دیوار لوکس' | 'نما و محوطه'
  finalCustomerPricePerSqm: number // Toman per m²
  pricePerM2: number
  previousPricePerM2?: number
  discountPercent?: number
  originalPricePerSqm?: number
  discountPlanTitle?: string
  sqmPerCarton: number
  areaPerCarton: number
  piecesPerCarton: number
  tilesPerCarton: number
  cartonWeightKg: number
  inventorySqm: number
  stockCartons: number
  inStock: boolean
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  description?: string
  richDescription?: string
  applications: string[]
  tags: string[]
  images: string[]
  gallery: string[]
  createdAt?: string
}

export const MOCK_PRODUCTS: Product[] = []
