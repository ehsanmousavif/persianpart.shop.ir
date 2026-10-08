import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import { StandardErrorDataSchema } from './common'

export const PriceRoundingPolicySchema = z.enum([
  'none',
  'ceil_to_1000',
  'ceil_to_10000',
  'round_to_1000',
])

export type PriceRoundingPolicy = z.infer<typeof PriceRoundingPolicySchema>

export const CommerceConfigSchema = z.object({
  currency: z.literal('Toman'),
  priceRoundingPolicy: PriceRoundingPolicySchema.default('ceil_to_1000'),
  availabilityThresholds: z.object({
    limitedStockMaxSqm: z.number().positive().default(50),
  }),
})

export type CommerceConfig = z.infer<typeof CommerceConfigSchema>

export const OrderingConfigSchema = z.object({
  customerCancellationWindowMinutes: z.number().int().nonnegative().default(120),
  orderingEnabled: z.boolean().default(true),
})

export type OrderingConfig = z.infer<typeof OrderingConfigSchema>

export const CatalogConfigSchema = z.object({
  activeFilters: z.array(z.string()).default(['dimensions', 'brand', 'color', 'finish', 'grade', 'category']),
  inventoryDisplayBehavior: z.enum(['badge_only', 'show_exact']).default('badge_only'),
})

export type CatalogConfig = z.infer<typeof CatalogConfigSchema>

export const SupportConfigSchema = z.object({
  supportPhone: z.string().default('۰۲۱-۸۸۸۸۸۸۸۸'),
  supportContact: z.string().default('واحد فروش و امور مشتریان پرشین پارت'),
  workingHours: z.string().default('شنبه تا چهارشنبه ۸:۳۰ الی ۱۷:۰۰'),
  supportMessages: z.object({
    outOfHoursMessage: z.string().optional(),
    cancellationGuidance: z.string().optional(),
  }),
})

export type SupportConfig = z.infer<typeof SupportConfigSchema>

export const GlobalConfigSchema = z.object({
  commerce: CommerceConfigSchema,
  ordering: OrderingConfigSchema,
  catalog: CatalogConfigSchema,
  support: SupportConfigSchema,
  updatedAt: z.string(),
})

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>

export const globalsContract = {
  get: oc
    .meta(openapi({ method: 'GET', path: '/globals', summary: 'دریافت تنظیمات سراسری سیستم' }))
    .output(GlobalConfigSchema),

  updateCommerce: oc
    .meta(openapi({ method: 'PUT', path: '/staff/globals/commerce', summary: 'به‌روزرسانی تنظیمات تجاری و گرد کردن قیمت (فقط ادمین)' }))
    .input(CommerceConfigSchema)
    .output(CommerceConfigSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  updateOrdering: oc
    .meta(openapi({ method: 'PUT', path: '/staff/globals/ordering', summary: 'به‌روزرسانی تنظیمات سفارش‌گیری و مهلت لغو (فقط ادمین)' }))
    .input(OrderingConfigSchema)
    .output(OrderingConfigSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  updateCatalog: oc
    .meta(openapi({ method: 'PUT', path: '/staff/globals/catalog', summary: 'به‌روزرسانی رفتار نمایش کاتالوگ و فیلترها (فقط ادمین)' }))
    .input(CatalogConfigSchema)
    .output(CatalogConfigSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  updateSupport: oc
    .meta(openapi({ method: 'PUT', path: '/staff/globals/support', summary: 'به‌روزرسانی اطلاعات تماس و ساعات کاری پشتیبانی' }))
    .input(SupportConfigSchema)
    .output(SupportConfigSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),
}
