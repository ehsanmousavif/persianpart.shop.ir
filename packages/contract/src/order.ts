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
// 1. Cart Validation & Pricing Quote Schemas
// ============================================================================

export const CartItemInputSchema = z.object({
  productId: EntityIdSchema,
  requestedSqm: z.number().positive('متراژ درخواستی باید بزرگتر از صفر باشد'),
})

export type CartItemInput = z.infer<typeof CartItemInputSchema>

export const ValidateCartInputSchema = z.object({
  items: z.array(CartItemInputSchema).min(1, 'سبد خرید نمی‌تواند خالی باشد'),
})

export type ValidateCartInput = z.infer<typeof ValidateCartInputSchema>

export const ValidatedCartItemSchema = z.object({
  productId: EntityIdSchema,
  sku: z.string(),
  productName: z.string(),
  cover: z.string().optional().nullable(),
  requestedSqm: z.number().positive(),
  cartonCount: z.number().int().positive(),
  sqmPerCarton: z.number().positive(),
  actualSqm: z.number().positive(),
  pricePerSqm: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
  inStock: z.boolean(),
  availableInventorySqm: z.number().nonnegative(),
})

export type ValidatedCartItem = z.infer<typeof ValidatedCartItemSchema>

export const ValidateCartOutputSchema = z.object({
  items: z.array(ValidatedCartItemSchema),
  totalAmount: z.number().nonnegative(),
  totalSqm: z.number().nonnegative(),
  totalCartons: z.number().int().nonnegative(),
  isValid: z.boolean(),
  errorReasons: z.array(z.string()),
})

export type ValidateCartOutput = z.infer<typeof ValidateCartOutputSchema>

// ============================================================================
// 2. Order & Historical Snapshot Schemas
// ============================================================================

export const OrderStatusSchema = z.enum([
  'pending_review',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
])

export type OrderStatus = z.infer<typeof OrderStatusSchema>

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

// ============================================================================
// 3. Unified Order & Pricing Contract
// ============================================================================

export const pricingContract = {
  validateCart: oc
    .meta(openapi({ method: 'POST', path: '/pricing/validate-cart', summary: 'اعتبارسنجی سبد خرید و محاسبه کارتن و قیمت نهایی' }))
    .input(ValidateCartInputSchema)
    .output(ValidateCartOutputSchema)
    .errors({
      UNAUTHORIZED: { data: StandardErrorDataSchema },
    }),
}

export const orderContract = {
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

  pricing: pricingContract,
}
