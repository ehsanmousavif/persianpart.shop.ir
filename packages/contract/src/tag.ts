import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import { EntityIdSchema, SlugSchema, StandardErrorDataSchema } from './common'

export const TagSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1, 'نام تگ الزامی است'),
  slug: SlugSchema,
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type Tag = z.infer<typeof TagSchema>

export const CreateTagInputSchema = z.object({
  name: z.string().min(1, 'نام تگ الزامی است'),
  slug: SlugSchema,
  isActive: z.boolean().default(true),
})

export type CreateTagInput = z.infer<typeof CreateTagInputSchema>

export const UpdateTagInputSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).optional(),
  slug: SlugSchema.optional(),
  isActive: z.boolean().optional(),
})

export type UpdateTagInput = z.infer<typeof UpdateTagInputSchema>

export const tagContract = {
  list: oc
    .meta(openapi({ method: 'GET', path: '/tags', summary: 'دریافت لیست تگ‌ها' }))
    .input(z.object({ onlyActive: z.coerce.boolean().optional() }).optional())
    .output(z.array(TagSchema)),

  getById: oc
    .meta(openapi({ method: 'GET', path: '/tags/{id}', summary: 'دریافت تکی تگ' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(TagSchema)
    .errors({
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  create: oc
    .meta(openapi({ method: 'POST', path: '/tags', summary: 'ایجاد تگ جدید' }))
    .input(CreateTagInputSchema)
    .output(TagSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  update: oc
    .meta(openapi({ method: 'PUT', path: '/tags/{id}', summary: 'ویرایش تگ' }))
    .input(UpdateTagInputSchema)
    .output(TagSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  toggleActive: oc
    .meta(openapi({ method: 'POST', path: '/tags/{id}/toggle-active', summary: 'فعال/غیرفعال‌سازی تگ' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(TagSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),
}
