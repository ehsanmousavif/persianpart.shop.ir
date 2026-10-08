import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import { EntityIdSchema, SlugSchema, StandardErrorDataSchema } from './common'

export const CustomerTypeSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1, 'نام نوع مشتری الزامی است'),
  slug: SlugSchema,
  markupPercent: z
    .number()
    .min(-50, 'درصد سود نمی‌تواند کمتر از -۵۰ باشد')
    .max(500, 'درصد سود نمی‌تواند بیشتر از ۵۰۰ باشد'),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CustomerType = z.infer<typeof CustomerTypeSchema>

export const CreateCustomerTypeInputSchema = z.object({
  name: z.string().min(1, 'نام نوع مشتری الزامی است'),
  slug: SlugSchema,
  markupPercent: z
    .number()
    .min(-50, 'درصد سود نمی‌تواند کمتر از -۵۰ باشد')
    .max(500, 'درصد سود نمی‌تواند بیشتر از ۵۰۰ باشد'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type CreateCustomerTypeInput = z.infer<typeof CreateCustomerTypeInputSchema>

export const UpdateCustomerTypeInputSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).optional(),
  slug: SlugSchema.optional(),
  markupPercent: z.number().min(-50).max(500).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateCustomerTypeInput = z.infer<typeof UpdateCustomerTypeInputSchema>

export const customerTypeContract = {
  list: oc
    .meta(openapi({ method: 'GET', path: '/customer-types', summary: 'دریافت لیست انواع مشتری' }))
    .output(z.array(CustomerTypeSchema)),

  getById: oc
    .meta(openapi({ method: 'GET', path: '/customer-types/{id}', summary: 'دریافت تکی نوع مشتری' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(CustomerTypeSchema)
    .errors({
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  create: oc
    .meta(openapi({ method: 'POST', path: '/customer-types', summary: 'ایجاد نوع مشتری جدید (فقط ادمین)' }))
    .input(CreateCustomerTypeInputSchema)
    .output(CustomerTypeSchema)
    .errors({
      CONFLICT: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  update: oc
    .meta(openapi({ method: 'PUT', path: '/customer-types/{id}', summary: 'ویرایش نوع مشتری (فقط ادمین)' }))
    .input(UpdateCustomerTypeInputSchema)
    .output(CustomerTypeSchema)
    .errors({
      NOT_FOUND: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  toggleActive: oc
    .meta(openapi({ method: 'POST', path: '/customer-types/{id}/toggle-active', summary: 'فعال/غیرفعال‌سازی نوع مشتری' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(CustomerTypeSchema)
    .errors({
      NOT_FOUND: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),
}
