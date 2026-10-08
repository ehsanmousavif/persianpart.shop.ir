import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import {
  EntityIdSchema,
  PaginationInputSchema,
  StandardErrorDataSchema,
  createPaginatedResponseSchema,
} from './common'
import { CartItemInputSchema, ValidatedCartItemSchema, pricingContract } from './pricing'

export const OrderStatusSchema = z.enum([
  'pending_review',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
])

export type OrderStatus = z.infer<typeof OrderStatusSchema>

/**
 * Historical snapshot of an item in the order.
 * Invariant: Never depends on subsequent product or customerType updates.
 */
export const OrderItemSnapshotSchema = z.object({
  id: EntityIdSchema,
  orderId: EntityIdSchema,
  productId: EntityIdSchema,

  sku: z.string(),
  productName: z.string(),

  requestedSqm: z.number().positive(),
  cartonCount: z.number().int().positive(),
  sqmPerCarton: z.number().positive(),
  actualSqm: z.number().positive(),

  basePricePerSqm: z.number().nonnegative(),
  customerTypeId: EntityIdSchema,
  customerTypeName: z.string(),
  markupPercent: z.number(),

  finalPricePerSqm: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
})

export type OrderItemSnapshot = z.infer<typeof OrderItemSnapshotSchema>

export const TimelineActorTypeSchema = z.enum(['customer', 'staff', 'system'])
export type TimelineActorType = z.infer<typeof TimelineActorTypeSchema>

export const TimelineEventTypeSchema = z.enum([
  'order_created',
  'status_changed',
  'customer_cancelled',
  'staff_cancelled',
  'order_completed',
])

export type TimelineEventType = z.infer<typeof TimelineEventTypeSchema>

export const OrderTimelineEventSchema = z.object({
  id: EntityIdSchema,
  orderId: EntityIdSchema,
  eventType: TimelineEventTypeSchema,
  actorType: TimelineActorTypeSchema,
  actorId: EntityIdSchema,
  timestamp: z.string(),
  metadata: z.record(z.unknown()).optional(),
})

export type OrderTimelineEvent = z.infer<typeof OrderTimelineEventSchema>

export const OrderSchema = z.object({
  id: EntityIdSchema,
  customerId: EntityIdSchema,
  customerStoreName: z.string().optional(),
  status: OrderStatusSchema,
  items: z.array(OrderItemSnapshotSchema),
  totalAmount: z.number().nonnegative(),
  totalSqm: z.number().nonnegative(),
  totalCartons: z.number().int().nonnegative(),
  notes: z.string().optional(),
  cancellationDeadline: z.string(),
  timeline: z.array(OrderTimelineEventSchema),
  cancellationReason: z.string().optional(),
  cancellationNote: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Order = z.infer<typeof OrderSchema>

export const SubmitOrderInputSchema = z.object({
  items: z.array(CartItemInputSchema).min(1, 'سبد خرید جهت ثبت سفارش الزامی است'),
  notes: z.string().optional(),
})

export type SubmitOrderInput = z.infer<typeof SubmitOrderInputSchema>

export const CustomerOrderFilterInputSchema = PaginationInputSchema.extend({
  status: OrderStatusSchema.optional(),
})

export type CustomerOrderFilterInput = z.infer<typeof CustomerOrderFilterInputSchema>

export const StaffOrderFilterInputSchema = PaginationInputSchema.extend({
  status: OrderStatusSchema.optional(),
  customerId: EntityIdSchema.optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

export type StaffOrderFilterInput = z.infer<typeof StaffOrderFilterInputSchema>

export const StaffUpdateOrderStatusInputSchema = z.object({
  id: EntityIdSchema,
  newStatus: OrderStatusSchema,
  note: z.string().optional(),
})

export type StaffUpdateOrderStatusInput = z.infer<typeof StaffUpdateOrderStatusInputSchema>

export const StaffCancelOrderInputSchema = z.object({
  id: EntityIdSchema,
  cancellationReason: z.string().min(1, 'دلیل لغو سفارش الزامی است'),
  cancellationNote: z.string().optional(),
})

export type StaffCancelOrderInput = z.infer<typeof StaffCancelOrderInputSchema>

export const CustomerCancelOrderInputSchema = z.object({
  id: EntityIdSchema,
  reason: z.string().optional(),
})

export type CustomerCancelOrderInput = z.infer<typeof CustomerCancelOrderInputSchema>

export const ReorderItemStatusSchema = z.enum(['ready', 'changed', 'unavailable', 'out_of_stock'])

export const ReorderComparisonItemSchema = z.object({
  productId: EntityIdSchema,
  sku: z.string(),
  productName: z.string(),
  status: ReorderItemStatusSchema,
  requestedSqm: z.number(),
  currentPricePerSqm: z.number().optional(),
  historicalPricePerSqm: z.number(),
  currentSqmPerCarton: z.number().optional(),
  historicalSqmPerCarton: z.number(),
  availableStockSqm: z.number(),
  cartItem: ValidatedCartItemSchema.optional(),
})

export const PrepareReorderOutputSchema = z.object({
  originalOrderId: EntityIdSchema,
  items: z.array(ReorderComparisonItemSchema),
  canSubmitDirectly: z.boolean(),
  notes: z.string().optional(),
})

export type PrepareReorderOutput = z.infer<typeof PrepareReorderOutputSchema>

export const orderContract = {
  // Customer-facing endpoints
  submit: oc
    .meta(openapi({ method: 'POST', path: '/orders', summary: 'ثبت سفارش قطعی تراکنشی توسط مشتری' }))
    .input(SubmitOrderInputSchema)
    .output(OrderSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      INSUFFICIENT_STOCK: { data: StandardErrorDataSchema },
      BAD_REQUEST: { data: StandardErrorDataSchema },
    }),

  list: oc
    .meta(openapi({ method: 'GET', path: '/orders', summary: 'دریافت تاریخچه سفارش‌های مشتری جاری' }))
    .input(CustomerOrderFilterInputSchema)
    .output(createPaginatedResponseSchema(OrderSchema))
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
    }),

  getById: oc
    .meta(openapi({ method: 'GET', path: '/orders/{id}', summary: 'مشاهده جزییات سفارش و تایم‌لاین توسط مشتری' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(OrderSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  cancel: oc
    .meta(openapi({ method: 'POST', path: '/orders/{id}/cancel', summary: 'لغو مستقیم سفارش توسط مشتری قبل از انقضای مهلت' }))
    .input(CustomerCancelOrderInputSchema)
    .output(OrderSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      CANCELLATION_DEADLINE_EXPIRED: { data: StandardErrorDataSchema },
      INVALID_STATUS_TRANSITION: { data: StandardErrorDataSchema },
    }),

  prepareReorder: oc
    .meta(openapi({ method: 'POST', path: '/orders/{id}/reorder', summary: 'آماده‌سازی سبد خرید مجدد بر اساس سفارش تاریخی و اعتبارسنجی قیمت و موجودی روز' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(PrepareReorderOutputSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  // Internal staff endpoints
  staffList: oc
    .meta(openapi({ method: 'GET', path: '/staff/orders', summary: 'لیست تمام سفارش‌های سیستم برای پرسنل' }))
    .input(StaffOrderFilterInputSchema)
    .output(createPaginatedResponseSchema(OrderSchema))
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
    }),

  staffGetById: oc
    .meta(openapi({ method: 'GET', path: '/staff/orders/{id}', summary: 'مشاهده جزییات کامل سفارش برای پرسنل' }))
    .input(z.object({ id: EntityIdSchema }))
    .output(OrderSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  staffUpdateStatus: oc
    .meta(openapi({ method: 'POST', path: '/staff/orders/{id}/update-status', summary: 'تغییر مرحله و وضعیت سفارش در ماشین وضعیت توسط پرسنل' }))
    .input(StaffUpdateOrderStatusInputSchema)
    .output(OrderSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      INVALID_STATUS_TRANSITION: { data: StandardErrorDataSchema },
    }),

  staffCancel: oc
    .meta(openapi({ method: 'POST', path: '/staff/orders/{id}/cancel', summary: 'لغو اداری سفارش توسط پرسنل همراه با ثبت دلیل' }))
    .input(StaffCancelOrderInputSchema)
    .output(OrderSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
      FORBIDDEN: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      INVALID_STATUS_TRANSITION: { data: StandardErrorDataSchema },
    }),

  // Unified cart validation & pricing quote sub-contract
  pricing: pricingContract,
}

