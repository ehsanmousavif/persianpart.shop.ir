import type { CollectionBeforeValidateHook } from 'payload'

/**
 * Calculates item metrics (carton counts, deliverable area, unit & line totals)
 * and computes order-level financials (subtotal, finalTotal) based on catalog products.
 */
export const calculateOrderTotals: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data) return data

  // 1. Auto-generate temporary orderNumber if missing
  if (!data.orderNumber) {
    const timestamp = Date.now().toString().slice(-6)
    data.orderNumber = `ptp ${timestamp}`
  }

  // 2. Calculate item metrics and order totals
  if (Array.isArray(data.items) && data.items.length > 0) {
    let calculatedSubtotal = 0
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
            const sqmPerCarton = (productDoc as any).sqmPerCarton || 1.44
            const basePrice = (productDoc as any).basePricePerSqm || 500000
            const requestedArea = Number(item.requestedArea) || 1

            const cartonCount = item.cartonCount || Math.ceil(requestedArea / sqmPerCarton)
            const deliverableArea =
              item.deliverableArea || Math.round(cartonCount * sqmPerCarton * 100) / 100
            const unitPrice = item.unitPrice || basePrice
            const totalPrice = item.totalPrice || Math.round(deliverableArea * unitPrice)

            item.cartonCount = cartonCount
            item.deliverableArea = deliverableArea
            item.unitPrice = unitPrice
            item.totalPrice = totalPrice

            calculatedSubtotal += totalPrice
          }
        } catch {
          // If product lookup fails, retain existing item numbers
          calculatedSubtotal += Number(item.totalPrice) || 0
        }
      }
    }

    if (!data.subtotal || data.subtotal === 0) {
      data.subtotal = calculatedSubtotal
    }
    const discount = Number(data.discountAmount) || 0
    const tax = Number(data.taxAmount) || 0
    data.finalTotal = Math.max(0, (data.subtotal || calculatedSubtotal) - discount + tax)
  }

  return data
}
