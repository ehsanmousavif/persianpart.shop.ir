import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import { EntityIdSchema, SlugSchema, StandardErrorDataSchema } from './common'

export const CategorySchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1, 'نام دسته‌بندی الزامی است'),
  slug: SlugSchema,
  ordering: z.number().int().default(0),
  parentId: EntityIdSchema.optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type Category = z.infer<typeof CategorySchema>

export const CreateCategoryInputSchema = z.object({
  name: z.string().min(1, 'نام دسته‌بندی الزامی است'),
  slug: SlugSchema,
  ordering: z.number().int().default(0),
  parentId: EntityIdSchema.optional().nullable(),
  isActive: z.boolean().default(true),
})

export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>

export const UpdateCategoryInputSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).optional(),
  slug: SlugSchema.optional(),
  ordering: z.number().int().optional(),
  parentId: EntityIdSchema.optional().nullable(),
  isActive: z.boolean().optional(),
})

export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>

export const categoryContract = {
  list: oc
    .meta(openapi({ method: 'GET', path: '/categories', summary: 'دریافت لیست دسته‌بندی‌ها' }))
    .input(z.object({ onlyActive: z.coerce.boolean().optional() }).optional())
    .output(z.array(CategorySchema)),

  getById: oc
    .meta(openapi({ method: 'GET', path: '/categories/{id}', summary: 'دریافت تکی دسته‌بندی' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(CategorySchema)
    .errors({
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  create: oc
    .meta(openapi({ method: 'POST', path: '/categories', summary: 'ایجاد دسته‌بندی جدید' }))
    .input(CreateCategoryInputSchema)
    .output(CategorySchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  update: oc
    .meta(openapi({ method: 'PUT', path: '/categories/{id}', summary: 'ویرایش دسته‌بندی' }))
    .input(UpdateCategoryInputSchema)
    .output(CategorySchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  toggleActive: oc
    .meta(openapi({ method: 'POST', path: '/categories/{id}/toggle-active', summary: 'فعال/غیرفعال‌سازی دسته‌بندی' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(CategorySchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),
}
