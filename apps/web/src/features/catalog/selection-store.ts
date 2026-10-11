import { useSyncExternalStore } from 'react'

const SELECTED_STORAGE_KEY = 'persianpart_selected_products'
const QUANTITIES_STORAGE_KEY = 'persianpart_product_quantities'

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
          selectedIds = parsed.map((s) => String(s).trim()).filter(Boolean)
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
          quantities = parsed
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

  toggleProduct: (productId: string) => {
    const cleanId = String(productId).trim()
    const current = memoryState.selectedIds
    const isSelected = current.includes(cleanId)
    const nextIds = isSelected
      ? current.filter((id) => id !== cleanId)
      : [...current, cleanId]

    const nextQuantities = { ...memoryState.quantities }
    if (isSelected) {
      delete nextQuantities[cleanId]
    }

    persistAndNotify({
      selectedIds: nextIds,
      quantities: nextQuantities,
    })
  },

  selectProduct: (productId: string) => {
    const cleanId = String(productId).trim()
    if (!memoryState.selectedIds.includes(cleanId)) {
      persistAndNotify({
        selectedIds: [...memoryState.selectedIds, cleanId],
        quantities: memoryState.quantities,
      })
    }
  },

  unselectProduct: (productId: string) => {
    const cleanId = String(productId).trim()
    const nextQuantities = { ...memoryState.quantities }
    delete nextQuantities[cleanId]

    persistAndNotify({
      selectedIds: memoryState.selectedIds.filter((id) => id !== cleanId),
      quantities: nextQuantities,
    })
  },

  setQuantity: (productId: string, quantity: number) => {
    const cleanId = String(productId).trim()
    const nextQuantities = {
      ...memoryState.quantities,
      [cleanId]: Math.max(0, quantity),
    }

    persistAndNotify({
      selectedIds: memoryState.selectedIds,
      quantities: nextQuantities,
    })
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
    isProductSelected: (id: string) => state.selectedIds.includes(String(id).trim()),
    toggleProduct: selectionStore.toggleProduct,
    selectProduct: selectionStore.selectProduct,
    unselectProduct: selectionStore.unselectProduct,
    setQuantity: selectionStore.setQuantity,
    clearSelection: selectionStore.clearSelection,
  }
}
