import { sdk } from '../payload'

export interface CartonCalcInput {
  productId?: string | number
  sqmPerCarton?: number
  pricePerSqm?: number
  requestedArea?: number
  requestedSqm?: number
}

export interface CartonCalcResult {
  cartonCount: number
  deliverableArea: number
  totalPrice: number
}

/**
 * Calculates standard tile carton metrics:
 * cartonCount = ceil(requestedArea / sqmPerCarton)
 * deliverableArea = round(cartonCount * sqmPerCarton, 2)
 * totalPrice = round(deliverableArea * pricePerSqm)
 */
export async function calculateCartonMetrics(input: CartonCalcInput): Promise<CartonCalcResult> {
  let sqmPerCarton = input.sqmPerCarton || 1.44
  let pricePerSqm = input.pricePerSqm || 500000
  const requestedArea = input.requestedArea || input.requestedSqm || 1

  if (input.productId && (!input.sqmPerCarton || !input.pricePerSqm)) {
    try {
      const prod: any = await sdk.findByID({ collection: 'products', id: input.productId })
      if (prod) {
        sqmPerCarton = prod.sqmPerCarton || sqmPerCarton
        pricePerSqm = prod.basePricePerSqm || pricePerSqm
      }
    } catch {
      // fallback to input defaults
    }
  }

  const cartonCount = Math.ceil(requestedArea / sqmPerCarton)
  const deliverableArea = Math.round(cartonCount * sqmPerCarton * 100) / 100
  const totalPrice = Math.round(deliverableArea * pricePerSqm)

  return {
    cartonCount,
    deliverableArea,
    totalPrice,
  }
}
