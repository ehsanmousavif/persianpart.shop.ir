import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import { EntityIdSchema, StandardErrorDataSchema } from './common'

export const CartItemInputSchema = z.object({
  productId: EntityIdSchema,
  requestedSqm: z.number().positive('متراژ درخواستی باید بزرگتر از صفر باشد'),
})

export type CartItemInput = z.infer<typeof CartItemInputSchema>

export const ValidateCartInputSchema = z.object({
  items: z.array(CartItemInputSchema).min(1, 'سبد خرید نمی‌تواند خالی باشد'),
})

export type ValidateCartInput = z.infer<typeof ValidateCartInputSchema>

export const ValidatedCartItemSchema = z.object({
  productId: EntityIdSchema,
  sku: z.string(),
  productName: z.string(),
  cover: z.string().optional().nullable(),
  requestedSqm: z.number().positive(),
  cartonCount: z.number().int().positive(),
  sqmPerCarton: z.number().positive(),
  actualSqm: z.number().positive(),
  pricePerSqm: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
  inStock: z.boolean(),
  availableInventorySqm: z.number().nonnegative(),
})

export type ValidatedCartItem = z.infer<typeof ValidatedCartItemSchema>

export const ValidateCartOutputSchema = z.object({
  items: z.array(ValidatedCartItemSchema),
  totalAmount: z.number().nonnegative(),
  totalSqm: z.number().nonnegative(),
  totalCartons: z.number().int().nonnegative(),
  isValid: z.boolean(),
  errorReasons: z.array(z.string()),
})

export type ValidateCartOutput = z.infer<typeof ValidateCartOutputSchema>

export const pricingContract = {
  validateCart: oc
    .meta(openapi({ method: 'POST', path: '/pricing/validate-cart', summary: 'اعتبارسنجی سبد خرید و محاسبه کارتن و قیمت نهایی' }))
    .input(ValidateCartInputSchema)
    .output(ValidateCartOutputSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
    }),
}
