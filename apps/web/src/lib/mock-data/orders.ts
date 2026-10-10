export type OrderStatus =
  | 'pending'
  | 'checking'
  | 'approved'
  | 'preparing'
  | 'shipping'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_admin'
  | 'cancelled'
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
  statusLabel: string
  storeName: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryMethod: string
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
  OrderStatus,
  { label: string; color: 'warning' | 'primary' | 'secondary' | 'success' | 'danger' | 'default' }
> = {
  pending: { label: 'در انتظار تأیید اولیه', color: 'warning' },
  checking: { label: 'در حال بررسی واحد بازرگانی', color: 'secondary' },
  approved: { label: 'تأیید شده بازرگانی', color: 'secondary' },
  preparing: { label: 'در حال آماده‌سازی و بارگیری', color: 'primary' },
  shipping: { label: 'در حال ارسال و بارنامه', color: 'primary' },
  completed: { label: 'تکمیل شده و تحویل نهایی', color: 'success' },
  cancelled_by_customer: { label: 'لغو شده توسط خریدار', color: 'danger' },
  cancelled_by_admin: { label: 'لغو شده توسط مدیریت / بازرگانی', color: 'danger' },
  cancelled: { label: 'لغو شده', color: 'danger' },
  processing: { label: 'در حال آماده‌سازی', color: 'primary' },
  ready: { label: 'آماده تحویل و بارنامه', color: 'primary' },
}

export const MOCK_ORDERS: Order[] = []
