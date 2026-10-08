import { implement } from '@orpc/server'
import {
  csvImportContract,
  type ImportPreviewReport,
  type ImportRunSummary,
} from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'
import { applyImportRun, createImportPreview } from '../services/csv-import'

const implementer = implement(csvImportContract).$context<Context>()

export const csvImportRouter = implementer.router({
  preview: implementer.preview.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'فقط پرسنل مجاز به بارگذاری فایل CSV هستند' } })
    }

    try {
      return await createImportPreview(input.filename, input.csvContent, context.user.id)
    } catch (err: any) {
      throw errors.BAD_REQUEST({ data: { message: err.message || 'خطا در پردازش فایل CSV' } })
    }
  }),

  apply: implementer.apply.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'فقط پرسنل مجاز به اعمال فایل CSV هستند' } })
    }

    try {
      return await applyImportRun(input.importRunId, context.user.id)
    } catch (err: any) {
      const msg = err.message || 'خطا در اعمال فایل CSV'
      if (msg.includes('قبلاً اعمال شده')) {
        throw errors.CONFLICT({ data: { message: msg } })
      }
      throw errors.NOT_FOUND({ data: { message: msg } })
    }
  }),

  listRuns: implementer.listRuns.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی فقط برای پرسنل مجاز است' } })
    }

    const page = input.page || 1
    const limit = input.limit || 20
    const offset = (page - 1) * limit

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM import_runs`)
    const total = parseInt(countRes.rows[0].total, 10)

    const res = await pool.query(
      `SELECT * FROM import_runs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    const items: ImportRunSummary[] = res.rows.map((r) => ({
      id: r.id,
      filename: r.filename,
      actorId: r.actor_id,
      status: r.status,
      totalRows: Number(r.total_rows),
      validRows: Number(r.valid_rows),
      changedRows: Number(r.changed_rows),
      unknownSkuRows: Number(r.unknown_sku_rows),
      invalidRows: Number(r.invalid_rows),
      appliedAt: r.applied_at ? new Date(r.applied_at).toISOString() : null,
      createdAt: new Date(r.created_at).toISOString(),
    }))

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }),

  getRunDetail: implementer.getRunDetail.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی پرسنلی الزامی است' } })
    }

    const res = await pool.query(`SELECT report FROM import_runs WHERE id = $1`, [input.id])
    if (res.rows.length === 0) {
      throw errors.NOT_FOUND({ data: { message: 'گزارش ایمپورت یافت نشد' } })
    }

    return res.rows[0].report as ImportPreviewReport
  }),
})
