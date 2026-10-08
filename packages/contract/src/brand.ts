import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import { EntityIdSchema, SlugSchema, StandardErrorDataSchema } from './common'

export const BrandSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1, 'نام برند الزامی است'),
  slug: SlugSchema,
  logo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type Brand = z.infer<typeof BrandSchema>

export const CreateBrandInputSchema = z.object({
  name: z.string().min(1, 'نام برند الزامی است'),
  slug: SlugSchema,
  logo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export type CreateBrandInput = z.infer<typeof CreateBrandInputSchema>

export const UpdateBrandInputSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).optional(),
  slug: SlugSchema.optional(),
  logo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export type UpdateBrandInput = z.infer<typeof UpdateBrandInputSchema>

export const brandContract = {
  list: oc
    .meta(openapi({ method: 'GET', path: '/brands', summary: 'دریافت لیست برندها' }))
    .input(z.object({ onlyActive: z.coerce.boolean().optional() }).optional())
    .output(z.array(BrandSchema)),

  getById: oc
    .meta(openapi({ method: 'GET', path: '/brands/{id}', summary: 'دریافت تکی برند' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(BrandSchema)
    .errors({
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  create: oc
    .meta(openapi({ method: 'POST', path: '/brands', summary: 'ایجاد برند جدید' }))
    .input(CreateBrandInputSchema)
    .output(BrandSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  update: oc
    .meta(openapi({ method: 'PUT', path: '/brands/{id}', summary: 'ویرایش برند' }))
    .input(UpdateBrandInputSchema)
    .output(BrandSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  toggleActive: oc
    .meta(openapi({ method: 'POST', path: '/brands/{id}/toggle-active', summary: 'فعال/غیرفعال‌سازی برند' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(BrandSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),
}
