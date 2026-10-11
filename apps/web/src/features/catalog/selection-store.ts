import { useSyncExternalStore } from 'react'

const SELECTED_STORAGE_KEY = 'persianpart_selected_products'
const QUANTITIES_STORAGE_KEY = 'persianpart_product_quantities'

export function normalizeId(id: unknown): string {
  if (id === null || id === undefined) return ''
  return String(id).replace(/["']/g, '').trim()
}

interface SelectionState {
  selectedIds: string[]
  quantities: Record<string, number>
}

let listeners: Array<() => void> = []

function getStoredState(): SelectionState {
  let selectedIds: string[] = []
  let quantities: Record<string, number> = {}

  if (typeof window !== 'undefined') {
    try {
      const rawSelected = localStorage.getItem(SELECTED_STORAGE_KEY)
      if (rawSelected) {
        const parsed = JSON.parse(rawSelected)
        if (Array.isArray(parsed)) {
          selectedIds = Array.from(new Set(parsed.map(normalizeId))).filter(Boolean)
        }
      }
    } catch {
      // Ignore JSON parse / localStorage errors
    }

    try {
      const rawQuantities = localStorage.getItem(QUANTITIES_STORAGE_KEY)
      if (rawQuantities) {
        const parsed = JSON.parse(rawQuantities)
        if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([k, v]) => {
            const cleanKey = normalizeId(k)
            if (cleanKey && typeof v === 'number') {
              quantities[cleanKey] = v
            }
          })
        }
      }
    } catch {
      // Ignore JSON parse / localStorage errors
    }
  }

  return { selectedIds, quantities }
}

let memoryState: SelectionState = getStoredState()

function persistAndNotify(nextState: SelectionState) {
  memoryState = nextState
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(nextState.selectedIds))
      localStorage.setItem(QUANTITIES_STORAGE_KEY, JSON.stringify(nextState.quantities))
    } catch {
      // Ignore localStorage quotas / private browsing errors
    }
  }
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SELECTED_STORAGE_KEY || e.key === QUANTITIES_STORAGE_KEY) {
      memoryState = getStoredState()
      listeners.forEach((listener) => listener())
    }
  })
}

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot(): SelectionState {
  return memoryState
}

export const selectionStore = {
  subscribe,
  getSnapshot,

  getSelectedIds: () => memoryState.selectedIds,
  getQuantities: () => memoryState.quantities,

  toggleProduct: (productId: unknown) => {
    const cleanId = normalizeId(productId)
    if (!cleanId) return
    const current = memoryState.selectedIds.map(normalizeId)
    const isSelected = current.includes(cleanId)
    const nextIds = isSelected
      ? current.filter((id) => id !== cleanId)
      : [...current, cleanId]

    const nextQuantities = { ...memoryState.quantities }
    if (isSelected) {
      delete nextQuantities[cleanId]
    }

    persistAndNotify({
      selectedIds: Array.from(new Set(nextIds)),
      quantities: nextQuantities,
    })
  },

  selectProduct: (productId: unknown) => {
    const cleanId = normalizeId(productId)
    if (!cleanId) return
    const current = memoryState.selectedIds.map(normalizeId)
    if (!current.includes(cleanId)) {
      persistAndNotify({
        selectedIds: Array.from(new Set([...current, cleanId])),
        quantities: memoryState.quantities,
      })
    }
  },

  unselectProduct: (productId: unknown) => {
    const cleanId = normalizeId(productId)
    if (!cleanId) return
    const nextQuantities = { ...memoryState.quantities }
    delete nextQuantities[cleanId]

    persistAndNotify({
      selectedIds: memoryState.selectedIds.map(normalizeId).filter((id) => id !== cleanId),
      quantities: nextQuantities,
    })
  },

  setQuantity: (productId: unknown, quantity: number) => {
    const cleanId = normalizeId(productId)
    if (!cleanId) return
    const nextQuantities = {
      ...memoryState.quantities,
      [cleanId]: Math.max(0, quantity),
    }

    persistAndNotify({
      selectedIds: memoryState.selectedIds,
      quantities: nextQuantities,
    })
  },

  reconcileWithCatalog: (validIds: unknown[]) => {
    const validSet = new Set(validIds.map(normalizeId).filter(Boolean))
    const current = memoryState.selectedIds.map(normalizeId).filter(Boolean)
    const nextIds = current.filter((id) => validSet.has(id))

    if (nextIds.length !== current.length) {
      const nextQuantities = { ...memoryState.quantities }
      Object.keys(nextQuantities).forEach((k) => {
        if (!validSet.has(normalizeId(k))) {
          delete nextQuantities[k]
        }
      })

      persistAndNotify({
        selectedIds: Array.from(new Set(nextIds)),
        quantities: nextQuantities,
      })
    }
  },

  clearSelection: () => {
    persistAndNotify({
      selectedIds: [],
      quantities: {},
    })
  },
}

export function useProductSelection() {
  const state = useSyncExternalStore(selectionStore.subscribe, selectionStore.getSnapshot, () => ({
    selectedIds: [],
    quantities: {},
  }))

  return {
    selectedIds: state.selectedIds,
    quantities: state.quantities,
    isProductSelected: (id: unknown) => {
      const cleanId = normalizeId(id)
      return state.selectedIds.some((s) => normalizeId(s) === cleanId)
    },
    toggleProduct: selectionStore.toggleProduct,
    selectProduct: selectionStore.selectProduct,
    unselectProduct: selectionStore.unselectProduct,
    setQuantity: selectionStore.setQuantity,
    reconcileWithCatalog: selectionStore.reconcileWithCatalog,
    clearSelection: selectionStore.clearSelection,
  }
}
