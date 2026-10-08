import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import {
  EntityIdSchema,
  PaginationInputSchema,
  SlugSchema,
  StandardErrorDataSchema,
  createPaginatedResponseSchema,
} from './common'

/**
 * Structured Dimensions: width x height in cm.
 */
export const ProductDimensionsSchema = z.object({
  width: z.number().positive('عرض باید عددی مثبت باشد'),
  height: z.number().positive('طول باید عددی مثبت باشد'),
})

export type ProductDimensions = z.infer<typeof ProductDimensionsSchema>

/**
 * Product Completeness Assessment
 */
export const ProductCompletenessSchema = z.object({
  score: z.number().int().min(0).max(100),
  isComplete: z.boolean(),
  missingCritical: z.array(z.string()),
  missingRecommended: z.array(z.string()),
})

export type ProductCompleteness = z.infer<typeof ProductCompletenessSchema>

/**
 * Full Core Product Schema (Internal/Staff view, includes base price and inventory)
 */
export const ProductSchema = z.object({
  id: EntityIdSchema,
  sku: z.string().trim().min(1, 'کد کالا (SKU) الزامی است'),
  name: z.string().trim().min(1, 'نام کالا الزامی است'),
  slug: SlugSchema,

  categoryId: EntityIdSchema.optional().nullable(),
  brandId: EntityIdSchema.optional().nullable(),

  color: z.string().optional().nullable(),
  finish: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),

  width: z.number().positive('عرض کاشی (cm) الزامی است'),
  height: z.number().positive('طول کاشی (cm) الزامی است'),

  piecesPerCarton: z.number().int().positive('تعداد در کارتن الزامی است'),
  sqmPerCarton: z.number().positive('متراژ هر کارتن الزامی است'),

  cover: z.string().optional().nullable(),
  gallery: z.array(z.string()).default([]),
  richDescription: z.string().optional().nullable(),

  basePricePerSqm: z.number().nonnegative('قیمت پایه بر حسب متر مربع الزامی است'),
  inventorySqm: z.number().nonnegative('موجودی بر حسب متر مربع الزامی است'),

  isActive: z.boolean().default(true),
  completeness: ProductCompletenessSchema.optional(),

  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Product = z.infer<typeof ProductSchema>

export const CreateProductInputSchema = z.object({
  sku: z.string().trim().min(1, 'کد SKU الزامی است'),
  name: z.string().trim().min(1, 'نام کالا الزامی است'),
  slug: SlugSchema,
  categoryId: EntityIdSchema.optional().nullable(),
  brandId: EntityIdSchema.optional().nullable(),
  color: z.string().optional().nullable(),
  finish: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  width: z.number().positive('عرض الزامی است'),
  height: z.number().positive('طول الزامی است'),
  piecesPerCarton: z.number().int().positive('تعداد در کارتن الزامی است'),
  sqmPerCarton: z.number().positive('متراژ هر کارتن الزامی است'),
  cover: z.string().optional().nullable(),
  gallery: z.array(z.string()).default([]),
  richDescription: z.string().optional().nullable(),
  basePricePerSqm: z.number().nonnegative().default(0),
  inventorySqm: z.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
})

export type CreateProductInput = z.infer<typeof CreateProductInputSchema>

export const UpdateProductInputSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).optional(),
  slug: SlugSchema.optional(),
  categoryId: EntityIdSchema.optional().nullable(),
  brandId: EntityIdSchema.optional().nullable(),
  color: z.string().optional().nullable(),
  finish: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  piecesPerCarton: z.number().int().positive().optional(),
  sqmPerCarton: z.number().positive().optional(),
  cover: z.string().optional().nullable(),
  gallery: z.array(z.string()).optional(),
  richDescription: z.string().optional().nullable(),
  basePricePerSqm: z.number().nonnegative().optional(),
  inventorySqm: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>

export const ProductFilterInputSchema = PaginationInputSchema.extend({
  search: z.string().optional(),
  categoryId: EntityIdSchema.optional(),
  brandId: EntityIdSchema.optional(),
  color: z.string().optional(),
  finish: z.string().optional(),
  grade: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
})

export type ProductFilterInput = z.infer<typeof ProductFilterInputSchema>

export const PricePreviewInputSchema = z.object({
  productId: EntityIdSchema,
  customerTypeId: EntityIdSchema.optional(),
  overrideMarkupPercent: z.number().optional(),
})

export type PricePreviewInput = z.infer<typeof PricePreviewInputSchema>

export const PricePreviewOutputSchema = z.object({
  productId: EntityIdSchema,
  sku: z.string(),
  productName: z.string(),
  basePricePerSqm: z.number(),
  markupPercent: z.number(),
  customerTypeName: z.string().optional(),
  finalCustomerPricePerSqm: z.number(),
})

export type PricePreviewOutput = z.infer<typeof PricePreviewOutputSchema>

export const productContract = {
  staffList: oc
    .meta(openapi({ method: 'GET', path: '/staff/products', summary: 'لیست محصولات کاتالوگ با قیمت پایه و موجودی (پرسنل)' }))
    .input(ProductFilterInputSchema)
    .output(createPaginatedResponseSchema(ProductSchema))
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  staffGetById: oc
    .meta(openapi({ method: 'GET', path: '/staff/products/{id}', summary: 'مشاهده جزییات محصول برای پرسنل' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(ProductSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  staffCreate: oc
    .meta(openapi({ method: 'POST', path: '/staff/products', summary: 'تعریف محصول جدید توسط پرسنل' }))
    .input(CreateProductInputSchema)
    .output(ProductSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  staffUpdate: oc
    .meta(openapi({ method: 'PUT', path: '/staff/products/{id}', summary: 'ویرایش مشخصات محصول توسط پرسنل' }))
    .input(UpdateProductInputSchema)
    .output(ProductSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  staffToggleActive: oc
    .meta(openapi({ method: 'POST', path: '/staff/products/{id}/toggle-active', summary: 'فعال/غیرفعال‌سازی محصول' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(ProductSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  staffPricePreview: oc
    .meta(openapi({ method: 'POST', path: '/staff/products/price-preview', summary: 'پیش‌نمایش محاسبه قیمت برای رده مشتری خاص' }))
    .input(PricePreviewInputSchema)
    .output(PricePreviewOutputSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),
}
