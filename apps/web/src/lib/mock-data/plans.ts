export interface B2BCustomer {
  id: string
  name: string
  company: string
  phone: string
  tier: 'VIP' | 'تجاری ممتاز' | 'پروژه‌ای'
}

export interface Plan {
  id: string
  title: string
  customerGreeting: string
  customerId: string
  customerName: string
  isActive: boolean
  productIds: string[]
  notes?: string
  createdAt: string
}

export const MOCK_CUSTOMERS: B2BCustomer[] = []
export const INITIAL_PLANS: Plan[] = []
