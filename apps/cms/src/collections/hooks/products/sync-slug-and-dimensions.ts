import type { CollectionBeforeValidateHook } from 'payload'

/**
 * Handles automatic slug generation from SKU and syncs width/height from the dimension relationship
 */
export const syncSlugAndDimensions: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data) return data

  // 1. Auto-generate slug if not explicitly specified
  if (!data.slug && data.sku) {
    data.slug = String(data.sku)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
  }

  // 2. Sync width and height from dimension relationship
  if (data.dimension) {
    const dimensionId =
      typeof data.dimension === 'object' && data.dimension !== null
        ? (data.dimension as any).id
        : data.dimension

    if (dimensionId) {
      try {
        const dimDoc = await req.payload.findByID({
          collection: 'dimensions',
          id: dimensionId,
          depth: 0,
        })
        if (dimDoc) {
          data.width = (dimDoc as any).width
          data.height = (dimDoc as any).height
        }
      } catch {
        // Fallback: leave existing width/height
      }
    }
  }

  return data
}
