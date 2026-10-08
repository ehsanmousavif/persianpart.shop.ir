import { useState, useEffect } from 'react'
import { INITIAL_PLANS, MOCK_CUSTOMERS, type Plan, type B2BCustomer } from '../../lib/mock-data/plans'
import { MOCK_PRODUCTS, type Product } from '../../lib/mock-data/products'

const STORAGE_KEY = 'persianpart_plans_v1'

function getInitialPlans(): Plan[] {
  if (typeof window === 'undefined') return INITIAL_PLANS
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // fallback
  }
  return INITIAL_PLANS
}

let currentPlans: Plan[] = getInitialPlans()
const listeners = new Set<(plans: Plan[]) => void>()

function broadcast(nextPlans: Plan[]) {
  currentPlans = nextPlans
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlans))
    } catch {
      // ignore
    }
  }
  listeners.forEach((listener) => listener(currentPlans))
}

export const plansStore = {
  getPlans: () => currentPlans,
  getCustomers: () => MOCK_CUSTOMERS,
  getProducts: () => MOCK_PRODUCTS,

  togglePlanStatus: (planId: string) => {
    const next = currentPlans.map((p) =>
      p.id === planId ? { ...p, isActive: !p.isActive } : p
    )
    broadcast(next)
  },

  savePlan: (data: Omit<Plan, 'id' | 'createdAt'> & { id?: string }) => {
    const customer = MOCK_CUSTOMERS.find((c) => c.id === data.customerId)
    const customerName = customer ? `${customer.name} (${customer.company})` : data.customerName

    if (data.id) {
      // Update existing
      const next = currentPlans.map((p) =>
        p.id === data.id
          ? {
              ...p,
              ...data,
              customerName,
            }
          : p
      )
      broadcast(next)
    } else {
      // Create new
      const newPlan: Plan = {
        id: `plan-${Date.now()}`,
        title: data.title,
        customerGreeting: data.customerGreeting,
        customerId: data.customerId,
        customerName,
        isActive: data.isActive,
        productIds: data.productIds,
        notes: data.notes,
        createdAt: 'امروز',
      }
      broadcast([newPlan, ...currentPlans])
    }
  },

  deletePlan: (planId: string) => {
    const next = currentPlans.filter((p) => p.id !== planId)
    broadcast(next)
  },

  resetToDefault: () => {
    broadcast(INITIAL_PLANS)
  },
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>(plansStore.getPlans())

  useEffect(() => {
    listeners.add(setPlans)
    return () => {
      listeners.delete(setPlans)
    }
  }, [])

  const customers = MOCK_CUSTOMERS
  const allProducts = MOCK_PRODUCTS

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
    togglePlanStatus: plansStore.togglePlanStatus,
    savePlan: plansStore.savePlan,
    deletePlan: plansStore.deletePlan,
    resetToDefault: plansStore.resetToDefault,
    getProductById,
    getCustomerById,
  }
}
