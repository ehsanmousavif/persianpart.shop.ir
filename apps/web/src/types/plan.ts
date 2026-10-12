import type {
  CustomerProfile,
  CustomerStaffDetail,
  CustomerType,
} from '@persianpart/contract'

export interface B2BCustomer {
  id: string
  name: string
  company: string
  phone: string
  tier: 'VIP' | 'تجاری ممتاز' | 'پروژه‌ای' | 'همکار' | 'عادی'
}

export interface Plan {
  id: string
  title: string
  customerGreeting: string
  customerId: string
  customerName: string
  type?: 'credit_terms' | 'product_discount'
  discountPercent?: number
  discountAmount?: number
  isActive: boolean
  status?: 'active' | 'expired' | 'draft'
  content?: string
  productIds: string[]
  notes?: string
  createdAt: string
}

export type {
  CustomerProfile,
  CustomerStaffDetail,
  CustomerType,
}
