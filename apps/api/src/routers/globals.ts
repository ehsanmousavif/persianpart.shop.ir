import { implement } from '@orpc/server'
import {
  globalsContract,
  type GlobalConfig,
} from '@persianpart/contract'
import type { Context } from '../context'
import { pool } from '../db'
import { logAuditEvent } from '../services/audit'

const implementer = implement(globalsContract).$context<Context>()

async function fetchFullGlobalConfig(): Promise<GlobalConfig> {
  const res = await pool.query(`SELECT key, value, updated_at FROM global_configs`)
  const configs: Record<string, any> = {}
  let latestUpdatedAt = new Date().toISOString()

  for (const row of res.rows) {
    configs[row.key] = row.value
    if (new Date(row.updated_at).toISOString() > latestUpdatedAt) {
      latestUpdatedAt = new Date(row.updated_at).toISOString()
    }
  }

  return {
    commerce: configs['commerce'] || {
      currency: 'Toman',
      priceRoundingPolicy: 'ceil_to_1000',
      availabilityThresholds: { limitedStockMaxSqm: 50 },
    },
    ordering: configs['ordering'] || {
      customerCancellationWindowMinutes: 120,
      orderingEnabled: true,
    },
    catalog: configs['catalog'] || {
      activeFilters: ['dimensions', 'brand', 'color', 'finish', 'grade', 'category'],
      inventoryDisplayBehavior: 'badge_only',
    },
    support: configs['support'] || {
      supportPhone: '۰۲۱-۸۸۸۸۸۸۸۸',
      supportContact: 'امور مشتریان پرشین پارت',
      workingHours: 'شنبه تا چهارشنبه ۸:۳۰ تا ۱۷:۰۰',
      supportMessages: {},
    },
    updatedAt: latestUpdatedAt,
  }
}

export const globalsRouter = implementer.router({
  get: implementer.get.handler(async () => {
    return fetchFullGlobalConfig()
  }),

  updateCommerce: implementer.updateCommerce.handler(async ({ input, context, errors }) => {
    if (context.user?.role !== 'admin') {
      throw errors.FORBIDDEN({ data: { message: 'تنها مدیر ارشد مجاز به تغییر تنظیمات تجاری است' } })
    }

    await pool.query(
      `INSERT INTO global_configs (key, value, updated_at)
       VALUES ('commerce', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(input)]
    )

    await logAuditEvent({
      actorType: 'staff',
      actorId: context.user.id,
      actorName: context.user.name,
      action: 'global_config_updated',
      entityType: 'global_config',
      entityId: 'commerce',
      metadata: { input },
    })

    return input
  }),

  updateOrdering: implementer.updateOrdering.handler(async ({ input, context, errors }) => {
    if (context.user?.role !== 'admin') {
      throw errors.FORBIDDEN({ data: { message: 'تنها مدیر ارشد مجاز به تغییر تنظیمات سفارش است' } })
    }

    await pool.query(
      `INSERT INTO global_configs (key, value, updated_at)
       VALUES ('ordering', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(input)]
    )

    await logAuditEvent({
      actorType: 'staff',
      actorId: context.user.id,
      actorName: context.user.name,
      action: 'global_config_updated',
      entityType: 'global_config',
      entityId: 'ordering',
      metadata: { input },
    })

    return input
  }),

  updateCatalog: implementer.updateCatalog.handler(async ({ input, context, errors }) => {
    if (context.user?.role !== 'admin') {
      throw errors.FORBIDDEN({ data: { message: 'تنها مدیر ارشد مجاز به تغییر تنظیمات کاتالوگ است' } })
    }

    await pool.query(
      `INSERT INTO global_configs (key, value, updated_at)
       VALUES ('catalog', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(input)]
    )

    await logAuditEvent({
      actorType: 'staff',
      actorId: context.user.id,
      actorName: context.user.name,
      action: 'global_config_updated',
      entityType: 'global_config',
      entityId: 'catalog',
      metadata: { input },
    })

    return input
  }),

  updateSupport: implementer.updateSupport.handler(async ({ input, context, errors }) => {
    if (!context.user) {
      throw errors.FORBIDDEN({ data: { message: 'دسترسی فقط برای پرسنل مجاز است' } })
    }

    await pool.query(
      `INSERT INTO global_configs (key, value, updated_at)
       VALUES ('support', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(input)]
    )

    await logAuditEvent({
      actorType: 'staff',
      actorId: context.user.id,
      actorName: context.user.name,
      action: 'global_config_updated',
      entityType: 'global_config',
      entityId: 'support',
      metadata: { input },
    })

    return input
  }),
})
