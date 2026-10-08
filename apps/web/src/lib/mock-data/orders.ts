export type OrderStatus =
  | 'pending'
  | 'approved'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

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
  status: OrderStatus
  statusLabel: string
  storeName: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryMethod: string
  notes?: string
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
  pending: { label: 'در انتظار بررسی', color: 'warning' },
  approved: { label: 'تأیید شده', color: 'secondary' },
  preparing: { label: 'در حال آماده‌سازی', color: 'primary' },
  ready: { label: 'آماده تحویل', color: 'primary' },
  completed: { label: 'تکمیل شده', color: 'success' },
  cancelled: { label: 'لغو شده', color: 'danger' },
}

export const MOCK_ORDERS: Order[] = []
