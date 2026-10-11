export type OrderStatus =
  | 'pending'
  | 'approve'
  | 'approved'
  | 'cancel'
  | 'cancelled'
  | 'checking'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_admin'
  | 'preparing'
  | 'shipping'
  | 'processing'
  | 'ready'

export interface OrderItem {
  productId: string
  productName: string
  productSlug: string
  productSku: string
  productImage: string
  dimension: string
  unitPrice: number
  requestedArea: number
  cartonCount: number
  deliverableArea: number
  totalPrice: number
}

export interface TimelineStep {
  id: string
  title: string
  description: string
  timestamp?: string
  status: 'completed' | 'current' | 'pending' | 'cancelled'
}

export interface Order {
  id: string
  orderNumber: string
  date: string
  createdAt?: string
  status: OrderStatus
  cancelledBy?: 'customer' | 'admin'
  statusLabel: string
  storeName: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  notes?: string
  cancellationDeadline?: string
  items: OrderItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  finalTotal: number
  timeline: TimelineStep[]
}

export const ORDER_STATUS_MAP: Record<
  string,
  { label: string; color: 'warning' | 'primary' | 'secondary' | 'success' | 'danger' | 'default' }
> = {
  pending: { label: 'در حال بررسی واحد بازرگانی', color: 'warning' },
  approve: { label: 'حواله ثبت شده (تکمیل شده)', color: 'success' },
  approved: { label: 'حواله ثبت شده (تکمیل شده)', color: 'success' },
  cancel: { label: 'لغو شده', color: 'danger' },
  cancelled: { label: 'لغو شده', color: 'danger' },
  checking: { label: 'در حال بررسی واحد بازرگانی', color: 'warning' },
  preparing: { label: 'ثبت سفارش توسط واحد بازرگانی', color: 'primary' },
  shipping: { label: 'در حال ارسال', color: 'primary' },
  completed: { label: 'حواله ثبت شده (تکمیل شده)', color: 'success' },
  cancelled_by_customer: { label: 'لغو توسط مشتری', color: 'danger' },
  cancelled_by_admin: { label: 'لغو توسط ادمین', color: 'danger' },
  processing: { label: 'در حال بررسی واحد بازرگانی', color: 'warning' },
  ready: { label: 'حواله ثبت شده (تکمیل شده)', color: 'success' },
}

export const MOCK_ORDERS: Order[] = []
