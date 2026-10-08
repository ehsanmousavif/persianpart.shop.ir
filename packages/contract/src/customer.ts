import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import {
  EntityIdSchema,
  IranianMobileSchema,
  PaginationInputSchema,
  StandardErrorDataSchema,
  createPaginatedResponseSchema,
} from './common'
import { CustomerTypeSchema, customerTypeContract } from './customer-type'

/**
 * Customer profile visible to the customer themselves.
 * Invariant: internalNotes is strictly excluded.
 */
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

/**
 * Detailed customer view for internal staff (Admin / Support).
 * Includes internal notes, full customer type, and active status.
 */
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

export const customerContract = {
  // Customer-facing self endpoints
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

  // Internal staff endpoints
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

  // Unified customer types & pricing tiers sub-contract
  types: customerTypeContract,
}

