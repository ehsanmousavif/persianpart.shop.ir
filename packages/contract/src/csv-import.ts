import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import {
  EntityIdSchema,
  PaginationInputSchema,
  StandardErrorDataSchema,
  createPaginatedResponseSchema,
} from './common'

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
