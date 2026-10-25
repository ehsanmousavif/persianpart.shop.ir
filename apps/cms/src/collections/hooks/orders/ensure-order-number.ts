import type { CollectionAfterChangeHook } from 'payload'

/**
 * Ensures newly created orders receive a canonical orderNumber matching `ptp ${doc.id}`
 */
export const ensureOrderNumber: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation === 'create' && (!doc.orderNumber || !doc.orderNumber.startsWith('ptp '))) {
    try {
      await req.payload.update({
        collection: 'orders',
        id: doc.id,
        data: {
          orderNumber: `ptp ${doc.id}`,
        },
      })
    } catch {}
  }
}
