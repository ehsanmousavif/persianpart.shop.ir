import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import {
  EntityIdSchema,
  PaginationInputSchema,
  StandardErrorDataSchema,
  createPaginatedResponseSchema,
} from './common'

export const AvailabilityBadgeSchema = z.enum(['available', 'limited', 'out_of_stock'])
export type AvailabilityBadge = z.infer<typeof AvailabilityBadgeSchema>

/**
 * Customer Catalog Product Schema
 * Invariant: basePricePerSqm, markupPercent, and raw inventory quantity are strictly hidden.
 */
export const CatalogProductSchema = z.object({
  id: EntityIdSchema,
  sku: z.string(),
  name: z.string(),
  slug: z.string(),

  categoryId: EntityIdSchema.optional().nullable(),
  categoryName: z.string().optional(),

  brandId: EntityIdSchema.optional().nullable(),
  brandName: z.string().optional(),

  color: z.string().optional().nullable(),
  finish: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  tags: z.array(z.string()),

  width: z.number().positive(),
  height: z.number().positive(),

  piecesPerCarton: z.number().int().positive(),
  sqmPerCarton: z.number().positive(),

  cover: z.string().optional().nullable(),
  gallery: z.array(z.string()),
  richDescription: z.string().optional().nullable(),

  finalCustomerPricePerSqm: z.number().nonnegative(),
  availability: AvailabilityBadgeSchema,
})

export type CatalogProduct = z.infer<typeof CatalogProductSchema>

export const CatalogFilterInputSchema = PaginationInputSchema.extend({
  search: z.string().optional(),
  categoryId: EntityIdSchema.optional(),
  brandId: EntityIdSchema.optional(),
  color: z.string().optional(),
  finish: z.string().optional(),
  grade: z.string().optional(),
  tag: z.string().optional(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  availability: AvailabilityBadgeSchema.optional(),
})

export type CatalogFilterInput = z.infer<typeof CatalogFilterInputSchema>

export const CartonCalculationInputSchema = z.object({
  productId: EntityIdSchema,
  requestedSqm: z.number().positive('متراژ درخواستی باید بزرگتر از صفر باشد'),
})

export type CartonCalculationInput = z.infer<typeof CartonCalculationInputSchema>

export const CartonCalculationOutputSchema = z.object({
  productId: EntityIdSchema,
  sqmPerCarton: z.number().positive(),
  requestedSqm: z.number().positive(),
  cartonCount: z.number().int().positive(),
  actualSqm: z.number().positive(),
  pricePerSqm: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
})

export type CartonCalculationOutput = z.infer<typeof CartonCalculationOutputSchema>

import { partsContract } from './parts'
import { categoryContract } from './category'
import { brandContract } from './brand'
import { tagContract } from './tag'
import { productContract } from './product'

export const catalogContract = {
  list: oc
    .meta(openapi({ method: 'GET', path: '/catalog', summary: 'کاتالوگ محصولات با قیمت اختصاصی مشتری جاری' }))
    .input(CatalogFilterInputSchema)
    .output(createPaginatedResponseSchema(CatalogProductSchema))
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
    }),

  getById: oc
    .meta(openapi({ method: 'GET', path: '/catalog/{id}', summary: 'مشاهده جزییات کاتالوگ محصول توسط مشتری' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(CatalogProductSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  calculateCartons: oc
    .meta(openapi({ method: 'POST', path: '/catalog/calculate-cartons', summary: 'محاسبه متراژ تحویلی و تعداد کارتن برای متراژ درخواستی' }))
    .input(CartonCalculationInputSchema)
    .output(CartonCalculationOutputSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  // Unified domain sub-contracts
  parts: partsContract,
  categories: categoryContract,
  brands: brandContract,
  tags: tagContract,
  manage: productContract,
}

