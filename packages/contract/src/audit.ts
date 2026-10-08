import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import {
  EntityIdSchema,
  PaginationInputSchema,
  StandardErrorDataSchema,
  createPaginatedResponseSchema,
} from './common'

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
