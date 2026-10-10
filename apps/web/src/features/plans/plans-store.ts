import { useState, useEffect } from 'react'
import { api } from '../../lib/api-client'
import { INITIAL_PLANS, type Plan, type B2BCustomer } from '../../lib/mock-data/plans'
import { MOCK_PRODUCTS, type Product } from '../../lib/mock-data/products'
import { formatPersianDate } from '../../lib/utils/date'

const STORAGE_KEY = 'persianpart_plans_v1'

function getInitialPlans(): Plan[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return parsed.map((p) => {
          if (p.createdAt && (p.createdAt.includes('2026') || p.createdAt.includes('2025') || p.createdAt.includes('2024') || p.createdAt.startsWith('20'))) {
            return {
              ...p,
              createdAt: formatPersianDate(p.createdAt),
            }
          }
          return p
        })
      }
    }
  } catch {
    // fallback
  }
  return []
}

function mapApiPlanToPlan(p: any): Plan {
  const firstUser = Array.isArray(p.users) && p.users.length > 0 ? p.users[0] : null
  const customerName = firstUser
    ? (firstUser.fullName || firstUser.companyName || firstUser.phone || 'کاربر')
    : 'عمومی'
  const customerId = firstUser ? String(firstUser.id) : ''
  const isActive = p.status === 'active'

  const productIds = Array.isArray(p.products)
    ? p.products.map((prod: any) =>
        typeof prod === 'object' && prod !== null ? String(prod.id) : String(prod)
      )
    : []

  const interpolate = (txt: string) => {
    if (!txt) return ''
    return txt
      .replace(/\{\{\s*user\.name\s*\}\}/gi, customerName)
      .replace(/\{\{\s*name\s*\}\}/gi, customerName)
      .replace(/\{name\}/gi, customerName)
      .replace(/\[نام\s*کاربر\]/gi, customerName)
      .replace(/\[نام\s*مشتری\]/gi, customerName)
      .replace(/\[نام\]/gi, customerName)
  }

  const rawTitle = p.title || `${customerName} عزیز، این طرح برای شماست`
  const title = interpolate(rawTitle)
  let rawContent = p.content || p.notes || ''
  let content = interpolate(rawContent)
  if (customerName !== 'عمومی' && !content.includes(customerName) && content.trim() !== '') {
    content = `${customerName} عزیز؛ ${content}`
  }

  return {
    id: String(p.id),
    title,
    customerGreeting: p.dynamicTitle ? interpolate(p.dynamicTitle) : title,
    customerId,
    customerName,
    type: p.type || 'credit_terms',
    discountPercent: p.discountPercent != null ? Number(p.discountPercent) : undefined,
    discountAmount: p.discountAmount != null ? Number(p.discountAmount) : undefined,
    isActive,
    status: p.status || (isActive ? 'active' : 'expired'),
    content,
    productIds,
    notes: content,
    createdAt: p.createdAt ? formatPersianDate(p.createdAt) : formatPersianDate(new Date()),
  }
}

let currentPlans: Plan[] = getInitialPlans()
let currentCustomers: B2BCustomer[] = []
let isLoadingPlans = false
const listeners = new Set<() => void>()

function broadcast() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPlans))
    } catch {
      // ignore
    }
  }
  listeners.forEach((listener) => listener())
}

async function fetchFromBackend() {
  try {
    isLoadingPlans = true
    broadcast()
    const [plansRes, usersRes] = await Promise.allSettled([
      api.plan.list({}),
      api.user.list({ limit: 100 }),
    ])

    if (plansRes.status === 'fulfilled' && plansRes.value?.items) {
      const mapped = plansRes.value.items.map(mapApiPlanToPlan)
      if (mapped.length > 0) {
        currentPlans = mapped
      }
    }

    if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
      currentCustomers = usersRes.value.map((u: any) => ({
        id: String(u.id),
        name: u.fullName || u.phone || `کاربر #${u.id}`,
        company: u.companyName || 'فروشگاه / همکار',
        phone: u.phone || '',
        tier: 'تجاری ممتاز' as const,
      }))
    }

    broadcast()
  } catch (err) {
    console.error('Error fetching plans/users:', err)
  } finally {
    isLoadingPlans = false
    broadcast()
  }
}

export const plansStore = {
  getPlans: () => currentPlans,
  getCustomers: () => currentCustomers,
  getProducts: () => MOCK_PRODUCTS,
  isLoading: () => isLoadingPlans,

  refresh: () => fetchFromBackend(),

  togglePlanStatus: async (planId: string) => {
    const plan = currentPlans.find((p) => p.id === planId)
    if (!plan) return

    const nextActive = !plan.isActive
    const nextStatus = nextActive ? 'active' : 'expired'

    currentPlans = currentPlans.map((p) =>
      p.id === planId ? { ...p, isActive: nextActive, status: nextStatus } : p
    )
    broadcast()

    if (!planId.startsWith('plan-')) {
      try {
        await api.plan.update({
          id: Number(planId) || planId,
          status: nextStatus,
        })
      } catch (err) {
        console.error('Failed to sync toggle with API:', err)
      }
    }
  },

  savePlan: async (data: Omit<Plan, 'id' | 'createdAt'> & { id?: string }) => {
    const customer = currentCustomers.find((c) => c.id === data.customerId)
    const customerName = customer ? `${customer.name} (${customer.company})` : data.customerName

    let backendId = data.id

    try {
      if (data.id && !data.id.startsWith('plan-')) {
        await api.plan.update({
          id: Number(data.id) || data.id,
          title: data.title,
          users: data.customerId ? [Number(data.customerId) || data.customerId] : undefined,
          content: data.content || data.notes || '',
          type: data.type || 'credit_terms',
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          status: data.status || (data.isActive ? 'active' : 'expired'),
          products: data.productIds?.map(Number).filter(Boolean),
        })
      } else {
        const created: any = await api.plan.create({
          title: data.title,
          users: data.customerId ? [Number(data.customerId) || data.customerId] : [2],
          content: data.content || data.notes || 'طرح ویژه',
          type: data.type || 'credit_terms',
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          status: data.status || (data.isActive ? 'active' : 'expired'),
          products: data.productIds?.map(Number).filter(Boolean),
        })
        if (created?.id) {
          backendId = String(created.id)
        }
      }
    } catch (err) {
      console.error('Failed to persist plan via API:', err)
    }

    if (data.id) {
      currentPlans = currentPlans.map((p) =>
        p.id === data.id
          ? {
              ...p,
              ...data,
              customerName,
              status: data.status || (data.isActive ? 'active' : 'expired'),
            }
          : p
      )
    } else {
      const newPlan: Plan = {
        id: backendId || `plan-${Date.now()}`,
        title: data.title,
        customerGreeting: data.customerGreeting,
        customerId: data.customerId,
        customerName,
        type: data.type || 'credit_terms',
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount,
        isActive: data.isActive,
        status: data.status || (data.isActive ? 'active' : 'expired'),
        content: data.content || '',
        productIds: data.productIds,
        notes: data.notes,
        createdAt: formatPersianDate(new Date()),
      }
      currentPlans = [newPlan, ...currentPlans]
    }

    broadcast()
  },

  deletePlan: (planId: string) => {
    currentPlans = currentPlans.filter((p) => p.id !== planId)
    broadcast()
  },

  resetToDefault: () => {
    currentPlans = INITIAL_PLANS
    broadcast()
    fetchFromBackend()
  },
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>(plansStore.getPlans())
  const [customers, setCustomers] = useState<B2BCustomer[]>(plansStore.getCustomers())
  const [allProducts] = useState<Product[]>(plansStore.getProducts())
  const [isLoading, setIsLoading] = useState<boolean>(plansStore.isLoading())

  useEffect(() => {
    const handleUpdate = () => {
      setPlans([...plansStore.getPlans()])
      setCustomers([...plansStore.getCustomers()])
      setIsLoading(plansStore.isLoading())
    }
    listeners.add(handleUpdate)
    handleUpdate()
    plansStore.refresh()
    return () => {
      listeners.delete(handleUpdate)
    }
  }, [])

  const getProductById = (id: string): Product | undefined => {
    return allProducts.find((p) => p.id === id)
  }

  const getCustomerById = (id: string): B2BCustomer | undefined => {
    return customers.find((c) => c.id === id)
  }

  return {
    plans,
    customers,
    allProducts,
    isLoading,
    refresh: plansStore.refresh,
    togglePlanStatus: plansStore.togglePlanStatus,
    savePlan: plansStore.savePlan,
    deletePlan: plansStore.deletePlan,
    resetToDefault: plansStore.resetToDefault,
    getProductById,
    getCustomerById,
  }
}
