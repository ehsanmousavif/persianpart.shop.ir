import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import {
  EntityIdSchema,
  PaginationInputSchema,
  StandardErrorDataSchema,
  createPaginatedResponseSchema,
} from './common'

// ============================================================================
// 1. Health Probes Contract
// ============================================================================

export const healthContract = {
  ping: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/health/ping',
        summary: 'Ping check',
        tags: ['Health'],
      })
    )
    .output(
      z.object({
        message: z.string(),
        timestamp: z.number(),
      })
    ),

  check: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/health/check',
        summary: 'System health check',
        tags: ['Health'],
      })
    )
    .output(
      z.object({
        status: z.enum(['ok', 'degraded', 'down']),
        service: z.string(),
        uptimeSeconds: z.number(),
        timestamp: z.string(),
        database: z.enum(['connected', 'disconnected']),
      })
    ),
}

// ============================================================================
// 2. Global Configurations Schemas & Contract
// ============================================================================

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

// ============================================================================
// 3. Audit Trail Schemas & Contract
// ============================================================================

export const AuditActorTypeSchema = z.enum(['staff', 'customer', 'system'])
export type AuditActorType = z.infer<typeof AuditActorTypeSchema>

export const AuditActionSchema = z.enum([
  'csv_apply',
  'customer_type_created',
  'customer_type_updated',
  'customer_created',
  'customer_updated',
  'customer_status_toggled',
  'order_created',
  'order_status_updated',
  'order_staff_cancelled',
  'order_customer_cancelled',
  'global_config_updated',
  'staff_created',
  'staff_updated',
  'staff_status_toggled',
])

export type AuditAction = z.infer<typeof AuditActionSchema>

export const AuditEventSchema = z.object({
  id: EntityIdSchema,
  actorType: AuditActorTypeSchema,
  actorId: EntityIdSchema,
  actorName: z.string().optional(),
  action: AuditActionSchema,
  entityType: z.string(),
  entityId: EntityIdSchema,
  timestamp: z.string(),
  metadata: z.record(z.unknown()).optional(),
})

export type AuditEvent = z.infer<typeof AuditEventSchema>

export const AuditFilterInputSchema = PaginationInputSchema.extend({
  actorType: AuditActorTypeSchema.optional(),
  actorId: EntityIdSchema.optional(),
  action: AuditActionSchema.optional(),
  entityType: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

export type AuditFilterInput = z.infer<typeof AuditFilterInputSchema>

export const auditContract = {
  list: oc
    .meta(openapi({ method: 'GET', path: '/staff/audit', summary: 'مشاهده لاگ‌های نظارتی تغییرناپذیر سیستم' }))
    .input(AuditFilterInputSchema)
    .output(createPaginatedResponseSchema(AuditEventSchema))
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  getById: oc
    .meta(openapi({ method: 'GET', path: '/staff/audit/{id}', summary: 'مشاهده تکی رویداد لاگ نظارتی' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(AuditEventSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),
}

// ============================================================================
// 4. CSV Batch Import Schemas & Contract
// ============================================================================

export const ImportRunStatusSchema = z.enum(['preview', 'applied', 'failed'])
export type ImportRunStatus = z.infer<typeof ImportRunStatusSchema>

export const CsvRowDiffSchema = z.object({
  sku: z.string(),
  productName: z.string().optional(),
  oldPrice: z.number().optional(),
  newPrice: z.number(),
  oldInventory: z.number().optional(),
  newInventory: z.number(),
  priceDiffPercent: z.number().optional(),
  inventoryDiff: z.number().optional(),
  isNewOutOfStock: z.boolean().default(false),
  isBackInStock: z.boolean().default(false),
})

export type CsvRowDiff = z.infer<typeof CsvRowDiffSchema>

export const SuspiciousChangeWarningSchema = z.object({
  type: z.enum(['large_price_jump', 'large_inventory_jump', 'many_zero_stock', 'other']),
  message: z.string(),
  sku: z.string().optional(),
})

export type SuspiciousChangeWarning = z.infer<typeof SuspiciousChangeWarningSchema>

export const ImportPreviewReportSchema = z.object({
  importRunId: EntityIdSchema,
  filename: z.string(),
  totalRows: z.number().int().nonnegative(),
  validRows: z.number().int().nonnegative(),
  changedRows: z.number().int().nonnegative(),
  unchangedRows: z.number().int().nonnegative(),
  unknownSkuCount: z.number().int().nonnegative(),
  invalidRowCount: z.number().int().nonnegative(),
  unknownSkus: z.array(z.string()),
  invalidRowErrors: z.array(z.object({ rowNumber: z.number(), error: z.string() })),
  priceChangesCount: z.number().int().nonnegative(),
  inventoryChangesCount: z.number().int().nonnegative(),
  outOfStockCount: z.number().int().nonnegative(),
  backInStockCount: z.number().int().nonnegative(),
  suspiciousWarnings: z.array(SuspiciousChangeWarningSchema),
  diffs: z.array(CsvRowDiffSchema),
})

export type ImportPreviewReport = z.infer<typeof ImportPreviewReportSchema>

export const CsvPreviewInputSchema = z.object({
  filename: z.string().min(1, 'نام فایل الزامی است'),
  csvContent: z.string().min(1, 'محتوای فایل CSV نمی‌تواند خالی باشد'),
})

export type CsvPreviewInput = z.infer<typeof CsvPreviewInputSchema>

export const CsvApplyInputSchema = z.object({
  importRunId: EntityIdSchema,
})

export type CsvApplyInput = z.infer<typeof CsvApplyInputSchema>

export const ImportRunSummarySchema = z.object({
  id: EntityIdSchema,
  filename: z.string(),
  actorId: EntityIdSchema,
  status: ImportRunStatusSchema,
  totalRows: z.number().int().nonnegative(),
  validRows: z.number().int().nonnegative(),
  changedRows: z.number().int().nonnegative(),
  unknownSkuRows: z.number().int().nonnegative(),
  invalidRows: z.number().int().nonnegative(),
  appliedAt: z.string().optional().nullable(),
  createdAt: z.string(),
})

export type ImportRunSummary = z.infer<typeof ImportRunSummarySchema>

export const csvImportContract = {
  preview: oc
    .meta(openapi({ method: 'POST', path: '/staff/csv-import/preview', summary: 'پیش‌نمایش تغییرات قیمت و موجودی فایل CSV همراه با تشخیص مغایرت‌ها' }))
    .input(CsvPreviewInputSchema)
    .output(ImportPreviewReportSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      BAD_REQUEST: { data: StandardErrorDataSchema },
    }),

  apply: oc
    .meta(openapi({ method: 'POST', path: '/staff/csv-import/apply', summary: 'اعمال نهایی تغییرات قیمت و موجودی فایل CSV پیش‌نمایش شده' }))
    .input(CsvApplyInputSchema)
    .output(ImportRunSummarySchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      CONFLICT: { data: StandardErrorDataSchema },
    }),

  listRuns: oc
    .meta(openapi({ method: 'GET', path: '/staff/csv-import/history', summary: 'مشاهده تاریخچه اجرای خط‌لوله‌های ایمپورت CSV' }))
    .input(PaginationInputSchema)
    .output(createPaginatedResponseSchema(ImportRunSummarySchema))
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  getRunDetail: oc
    .meta(openapi({ method: 'GET', path: '/staff/csv-import/history/{id}', summary: 'مشاهده جزییات و گزارش کامل یک ایمپورت مشخص' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(ImportPreviewReportSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),
}

// ============================================================================
// 5. Payload CMS Integration Schemas & Contract
// ============================================================================

export const CmsStatusSchema = z.object({
  cmsUrl: z.string(),
  isReachable: z.boolean(),
  collections: z.array(z.string()),
})

export const CmsMediaItemSchema = z.object({
  id: z.string().or(z.number()),
  alt: z.string().optional(),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  filesize: z.number().optional(),
  url: z.string().optional(),
  createdAt: z.string().optional(),
})

export type CmsStatus = z.infer<typeof CmsStatusSchema>
export type CmsMediaItem = z.infer<typeof CmsMediaItemSchema>

export const cmsContract = {
  getStatus: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/cms/status',
        summary: 'Get CMS connection status',
        tags: ['CMS Integration'],
      })
    )
    .output(CmsStatusSchema),

  listMedia: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/cms/media',
        summary: 'List media from Payload CMS',
        tags: ['CMS Integration'],
      })
    )
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10),
          page: z.number().min(1).default(1),
        })
        .default({})
    )
    .output(
      z.object({
        docs: z.array(CmsMediaItemSchema),
        totalDocs: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        page: z.number(),
      })
    ),
}

// ============================================================================
// 6. Unified System Domain Contract
// ============================================================================

export const systemContract = {
  health: healthContract,
  globals: globalsContract,
  audit: auditContract,
  csvImport: csvImportContract,
  cms: cmsContract,
}

export type SystemContract = typeof systemContract
