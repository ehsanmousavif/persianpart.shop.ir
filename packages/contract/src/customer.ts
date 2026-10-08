import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import {
  EntityIdSchema,
  IranianMobileSchema,
  PaginationInputSchema,
  SlugSchema,
  StandardErrorDataSchema,
  createPaginatedResponseSchema,
} from './common'

// ============================================================================
// 1. Customer Types & Pricing Tiers Schemas
// ============================================================================

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

// ============================================================================
// 2. Customer Profile & Staff Customer Schemas
// ============================================================================

export const CustomerProfileSchema = z.object({
  id: EntityIdSchema,
  storeName: z.string().min(1, 'نام فروشگاه/کسب‌وکار الزامی است'),
  contactName: z.string().min(1, 'نام شخص رابط الزامی است'),
  mobile: IranianMobileSchema,
  phone: z.string().optional(),
  province: z.string().min(1, 'استان الزامی است'),
  city: z.string().min(1, 'شهر الزامی است'),
  address: z.string().min(1, 'آدرس الزامی است'),
  customerTypeId: EntityIdSchema,
  customerType: CustomerTypeSchema.pick({
    id: true,
    name: true,
    slug: true,
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CustomerProfile = z.infer<typeof CustomerProfileSchema>

export const CustomerStaffDetailSchema = CustomerProfileSchema.extend({
  isActive: z.boolean(),
  internalNotes: z.string().optional(),
  customerType: CustomerTypeSchema.optional(),
})

export type CustomerStaffDetail = z.infer<typeof CustomerStaffDetailSchema>

export const CreateCustomerInputSchema = z.object({
  storeName: z.string().min(1, 'نام فروشگاه الزامی است'),
  contactName: z.string().min(1, 'نام شخص رابط الزامی است'),
  mobile: IranianMobileSchema,
  phone: z.string().optional(),
  province: z.string().min(1, 'استان الزامی است'),
  city: z.string().min(1, 'شهر الزامی است'),
  address: z.string().min(1, 'آدرس الزامی است'),
  customerTypeId: EntityIdSchema,
  internalNotes: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type CreateCustomerInput = z.infer<typeof CreateCustomerInputSchema>

export const UpdateCustomerInputSchema = z.object({
  id: EntityIdSchema,
  storeName: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  phone: z.string().optional(),
  province: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  customerTypeId: EntityIdSchema.optional(),
  internalNotes: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateCustomerInput = z.infer<typeof UpdateCustomerInputSchema>

export const UpdateCustomerProfileInputSchema = z.object({
  storeName: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  phone: z.string().optional(),
  province: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
})

export type UpdateCustomerProfileInput = z.infer<typeof UpdateCustomerProfileInputSchema>

export const CustomerFilterInputSchema = PaginationInputSchema.extend({
  search: z.string().optional(),
  customerTypeId: EntityIdSchema.optional(),
  isActive: z.coerce.boolean().optional(),
})

export type CustomerFilterInput = z.infer<typeof CustomerFilterInputSchema>

// ============================================================================
// 3. Unified Customer & Customer Types Contract
// ============================================================================

export const customerTypeContract = {
  list: oc
    .meta(openapi({ method: 'GET', path: '/customer-types', summary: 'دریافت لیست انواع مشتری' }))
    .output(z.array(CustomerTypeSchema)),

  getById: oc
    .meta(openapi({ method: 'GET', path: '/customer-types/{id}', summary: 'دریافت تکی نوع مشتری' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(CustomerTypeSchema)
    .errors({ NOT_FOUND: { data: StandardErrorDataSchema } }),

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

export const customerContract = {
  getProfile: oc
    .meta(openapi({ method: 'GET', path: '/customer/profile', summary: 'دریافت پروفایل مشتری جاری' }))
    .output(CustomerProfileSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  updateProfile: oc
    .meta(openapi({ method: 'PUT', path: '/customer/profile', summary: 'ویرایش اطلاعات پروفایل توسط مشتری' }))
    .input(UpdateCustomerProfileInputSchema)
    .output(CustomerProfileSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  staffList: oc
    .meta(openapi({ method: 'GET', path: '/staff/customers', summary: 'لیست پرسنلی مشتریان با فیلتر' }))
    .input(CustomerFilterInputSchema)
    .output(createPaginatedResponseSchema(CustomerStaffDetailSchema))
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  staffGetById: oc
    .meta(openapi({ method: 'GET', path: '/staff/customers/{id}', summary: 'مشاهده جزییات کامل مشتری توسط پرسنل' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(CustomerStaffDetailSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  staffCreate: oc
    .meta(openapi({ method: 'POST', path: '/staff/customers', summary: 'ایجاد مشتری تجاری جدید توسط پرسنل' }))
    .input(CreateCustomerInputSchema)
    .output(CustomerStaffDetailSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  staffUpdate: oc
    .meta(openapi({ method: 'PUT', path: '/staff/customers/{id}', summary: 'ویرایش مشتری توسط پرسنل' }))
    .input(UpdateCustomerInputSchema)
    .output(CustomerStaffDetailSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  staffToggleActive: oc
    .meta(openapi({ method: 'POST', path: '/staff/customers/{id}/toggle-active', summary: 'فعال یا غیرفعال‌سازی حساب مشتری' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(CustomerStaffDetailSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  types: customerTypeContract,
}
