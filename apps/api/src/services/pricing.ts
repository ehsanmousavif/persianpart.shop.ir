import { pool } from '../db'
import type {
  PriceRoundingPolicy,
  ValidateCartOutput,
  ValidatedCartItem,
} from '@persianpart/contract'

export function applyPriceRounding(rawPrice: number, policy: PriceRoundingPolicy = 'ceil_to_1000'): number {
  switch (policy) {
    case 'ceil_to_1000':
      return Math.ceil(rawPrice / 1000) * 1000
    case 'ceil_to_10000':
      return Math.ceil(rawPrice / 10000) * 10000
    case 'round_to_1000':
      return Math.round(rawPrice / 1000) * 1000
    case 'none':
    default:
      return Math.round(rawPrice)
  }
}

export function calculateCustomerPrice(
  basePricePerSqm: number,
  markupPercent: number,
  policy: PriceRoundingPolicy = 'ceil_to_1000'
): number {
  const rawPrice = basePricePerSqm * (1 + markupPercent / 100)
  return applyPriceRounding(rawPrice, policy)
}

export function calculatePackaging(
  requestedSqm: number,
  sqmPerCarton: number
): { cartonCount: number; actualSqm: number } {
  // Invariant: Round-down is strictly forbidden.
  const cartonCount = Math.ceil(requestedSqm / sqmPerCarton)
  const actualSqm = Number((cartonCount * sqmPerCarton).toFixed(4))
  return { cartonCount, actualSqm }
}

export async function validateCartItems(
  items: Array<{ productId: string; requestedSqm: number }>,
  customerTypeId?: string
): Promise<ValidateCartOutput> {
  // 1. Get markup for customerType (default to 0% if not specified)
  let markupPercent = 0
  if (customerTypeId) {
    const ctRes = await pool.query(
      `SELECT markup_percent FROM customer_types WHERE id = $1 AND is_active = true`,
      [customerTypeId]
    )
    if (ctRes.rows.length > 0) {
      markupPercent = Number(ctRes.rows[0].markup_percent)
    }
  }

  // 2. Get global price rounding policy
  let roundingPolicy: PriceRoundingPolicy = 'ceil_to_1000'
  const configRes = await pool.query(`SELECT value FROM global_configs WHERE key = 'commerce'`)
  if (configRes.rows.length > 0 && configRes.rows[0].value?.priceRoundingPolicy) {
    roundingPolicy = configRes.rows[0].value.priceRoundingPolicy
  }

  const validatedItems: ValidatedCartItem[] = []
  const errorReasons: string[] = []
  let totalAmount = 0
  let totalSqm = 0
  let totalCartons = 0

  for (const item of items) {
    const prodRes = await pool.query(
      `SELECT id, sku, name, cover, sqm_per_carton, base_price_per_sqm, inventory_sqm, is_active
       FROM products WHERE id = $1`,
      [item.productId]
    )

    if (prodRes.rows.length === 0) {
      errorReasons.push(`کالای با شناسه ${item.productId} در کاتالوگ یافت نشد`)
      continue
    }

    const prod = prodRes.rows[0]
    if (!prod.is_active) {
      errorReasons.push(`کالای ${prod.name} (${prod.sku}) غیرفعال است`)
    }

    const sqmPerCarton = Number(prod.sqm_per_carton)
    const basePrice = Number(prod.base_price_per_sqm)
    const inventory = Number(prod.inventory_sqm)

    const { cartonCount, actualSqm } = calculatePackaging(item.requestedSqm, sqmPerCarton)
    const pricePerSqm = calculateCustomerPrice(basePrice, markupPercent, roundingPolicy)
    const lineTotal = Math.round(actualSqm * pricePerSqm)

    const inStock = actualSqm <= inventory
    if (!inStock) {
      errorReasons.push(
        `موجودی کالای ${prod.name} کافی نیست (موجودی: ${inventory} متر مربع، متراژ درخواستی با بسته‌بندی: ${actualSqm} متر مربع)`
      )
    }

    validatedItems.push({
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      cover: prod.cover || null,
      requestedSqm: item.requestedSqm,
      cartonCount,
      sqmPerCarton,
      actualSqm,
      pricePerSqm,
      lineTotal,
      inStock,
      availableInventorySqm: inventory,
    })

    totalAmount += lineTotal
    totalSqm += actualSqm
    totalCartons += cartonCount
  }

  const isValid = errorReasons.length === 0 && validatedItems.length > 0

  return {
    items: validatedItems,
    totalAmount,
    totalSqm: Number(totalSqm.toFixed(4)),
    totalCartons,
    isValid,
    errorReasons,
  }
}
