import type { CollectionBeforeChangeHook } from 'payload'

const isCancelledStatus = (s?: string) =>
  s === 'cancel' ||
  s === 'cancelled' ||
  s === 'cancelled_by_customer' ||
  s === 'cancelled_by_admin'

/**
 * Handles stock synchronization during order lifecycle transitions:
 * - Decrements inventory stock on initial order creation
 * - Restores inventory stock when an order is cancelled
 * - Normalizes cancellation status and initiator
 */
export const syncInventoryOnChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (!data) return data

  // A. Handle Inventory decrement on order creation
  if (operation === 'create' && Array.isArray(data.items)) {
    for (const item of data.items) {
      const productId =
        typeof item.product === 'object' && item.product !== null
          ? (item.product as any).id
          : item.product

      if (productId) {
        try {
          const productDoc = await req.payload.findByID({
            collection: 'products',
            id: productId,
            depth: 0,
          })
          if (productDoc) {
            const cartonCount = Number(item.cartonCount) || 0
            const deliverableArea = Number(item.deliverableArea) || 0
            const currentCartons = Number((productDoc as any).stockCartons ?? 350)
            const currentSqm = Number((productDoc as any).inventorySqm ?? 504)

            const nextCartons = Math.max(0, currentCartons - cartonCount)
            const nextSqm = Math.max(0, Math.round((currentSqm - deliverableArea) * 100) / 100)

            await req.payload.update({
              collection: 'products',
              id: productId,
              data: {
                stockCartons: nextCartons,
                inventorySqm: nextSqm,
              },
            })
          }
        } catch (err) {
          console.error('Failed to decrement product stock:', err)
        }
      }
    }
  }

  // B. Handle Inventory restoration on cancellation (by customer or admin)
  if (
    operation === 'update' &&
    originalDoc &&
    data.status &&
    isCancelledStatus(data.status) &&
    !isCancelledStatus(originalDoc.status)
  ) {
    const itemsToRestore = Array.isArray(originalDoc.items)
      ? originalDoc.items
      : Array.isArray(data.items)
        ? data.items
        : []

    for (const item of itemsToRestore) {
      const productId =
        typeof item.product === 'object' && item.product !== null
          ? (item.product as any).id
          : item.product

      if (productId) {
        try {
          const productDoc = await req.payload.findByID({
            collection: 'products',
            id: productId,
            depth: 0,
          })
          if (productDoc) {
            const cartonCount = Number(item.cartonCount) || 0
            const deliverableArea = Number(item.deliverableArea) || 0
            const currentCartons = Number((productDoc as any).stockCartons ?? 350)
            const currentSqm = Number((productDoc as any).inventorySqm ?? 504)

            const restoredCartons = currentCartons + cartonCount
            const restoredSqm = Math.round((currentSqm + deliverableArea) * 100) / 100

            await req.payload.update({
              collection: 'products',
              id: productId,
              data: {
                stockCartons: restoredCartons,
                inventorySqm: restoredSqm,
              },
            })
          }
        } catch (err) {
          console.error('Failed to restore product stock on cancel:', err)
        }
      }
    }
  }

  // C. Normalize cancellation status & initiator
  if (data.status === 'cancelled_by_customer') {
    data.cancelledBy = 'customer'
  } else if (data.status === 'cancelled_by_admin') {
    data.cancelledBy = 'admin'
  } else if (data.status === 'cancel') {
    if (data.cancelledBy === 'customer') {
      data.status = 'cancelled_by_customer'
    } else {
      data.status = 'cancelled_by_admin'
    }
  }

  return data
}
