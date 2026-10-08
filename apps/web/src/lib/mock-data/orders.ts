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

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-8821',
    orderNumber: 'PP-1403-8821',
    date: '۱۴۰۳/۰۷/۱۰ - ۱۱:۳۰',
    status: 'preparing',
    statusLabel: 'در حال آماده‌سازی',
    storeName: 'بازرگانی دهقان (پرشین پارت تهران)',
    customerName: 'آرش دهقان',
    customerPhone: '۰۹۱۲۳۴۵۶۷۸۹',
    deliveryAddress: 'تهران، بزرگراه فتح، خیابان هفدهم شهریور، پلاک ۱۴، انبار مرکزی',
    deliveryMethod: 'باربری خاور سرپوشیده اختصاصی',
    notes: 'تخلیه با لیفتراک در انبار شماره ۲ انجام شود.',
    items: [
      {
        productId: 'prod-1',
        productName: 'پرسلان کلکته گلد سوپر پولیش',
        productSlug: 'calacatta-gold-60120-polish',
        productSku: 'PP-CAL-6012-POL',
        productImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80',
        dimension: '60×120',
        unitPrice: 540000,
        requestedArea: 35.0,
        cartonCount: 25,
        deliverableArea: 36.0,
        totalPrice: 19440000,
      },
      {
        productId: 'prod-3',
        productName: 'سرامیک پرسلان کرما مارفیل براق',
        productSlug: 'crema-marfil-6060-glossy',
        productSku: 'PP-CRM-6060-GLS',
        productImage: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=300&q=80',
        dimension: '60×60',
        unitPrice: 360000,
        requestedArea: 28.0,
        cartonCount: 20,
        deliverableArea: 28.8,
        totalPrice: 10368000,
      },
    ],
    subtotal: 29808000,
    discountAmount: 1490400,
    taxAmount: 2548584,
    finalTotal: 30866184,
    timeline: [
      {
        id: 't-1',
        title: 'ثبت سفارش',
        description: 'سفارش توسط خریدار در سامانه پرشین‌پارت ثبت شد.',
        timestamp: '۱۴۰۳/۰۷/۱۰ - ۱۱:۳۰',
        status: 'completed',
      },
      {
        id: 't-2',
        title: 'تأیید واحد بازرگانی',
        description: 'اعتبار مالی و موجودی انبار کارخانه تأیید گردید.',
        timestamp: '۱۴۰۳/۰۷/۱۰ - ۱۲:۱۵',
        status: 'completed',
      },
      {
        id: 't-3',
        title: 'در حال آماده‌سازی و بارگیری',
        description: 'پالت‌بندی و کنترل کیفی در سالن انبار مکانیزه در جریان است.',
        timestamp: '۱۴۰۳/۰۷/۱۰ - ۱۴:۰۰',
        status: 'current',
      },
      {
        id: 't-4',
        title: 'آماده تحویل / صدور بارنامه',
        description: 'تحویل به ناوگان حمل و هماهنگی با انبار مقصد.',
        status: 'pending',
      },
      {
        id: 't-5',
        title: 'تکمیل شده و تحویل نهایی',
        description: 'تخلیه در محل انبار خریدار و امضای حواله الکترونیک.',
        status: 'pending',
      },
    ],
  },
  {
    id: 'ord-7910',
    orderNumber: 'PP-1403-7910',
    date: '۱۴۰۳/۰۷/۰۲ - ۰۹:۱۵',
    status: 'completed',
    statusLabel: 'تکمیل شده',
    storeName: 'بازرگانی دهقان (پرشین پارت تهران)',
    customerName: 'آرش دهقان',
    customerPhone: '۰۹۱۲۳۴۵۶۷۸۹',
    deliveryAddress: 'تهران، بزرگراه فتح، خیابان هفدهم شهریور، پلاک ۱۴، انبار مرکزی',
    deliveryMethod: 'باربری تریلی کفی',
    items: [
      {
        productId: 'prod-2',
        productName: 'اسلب اونیکس گری مات کالیبره',
        productSlug: 'onyx-grey-80160-matte',
        productSku: 'PP-ONX-8016-MAT',
        productImage: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80',
        dimension: '80×160',
        unitPrice: 680000,
        requestedArea: 50.0,
        cartonCount: 20,
        deliverableArea: 51.2,
        totalPrice: 34816000,
      },
    ],
    subtotal: 34816000,
    discountAmount: 1740800,
    taxAmount: 2976768,
    finalTotal: 36051968,
    timeline: [
      { id: 't-1', title: 'ثبت سفارش', description: 'سفارش ثبت گردید.', timestamp: '۱۴۰۳/۰۷/۰۲ - ۰۹:۱۵', status: 'completed' },
      { id: 't-2', title: 'تأیید واحد بازرگانی', description: 'تأییدیه مالی صادر شد.', timestamp: '۱۴۰۳/۰۷/۰۲ - ۰۹:۴۰', status: 'completed' },
      { id: 't-3', title: 'در حال آماده‌سازی', description: 'بارگیری انجام شد.', timestamp: '۱۴۰۳/۰۷/۰۲ - ۱۳:۰۰', status: 'completed' },
      { id: 't-4', title: 'آماده تحویل', description: 'بارنامه صادر و خودرو اعزام شد.', timestamp: '۱۴۰۳/۰۷/۰۲ - ۱۵:۳۰', status: 'completed' },
      { id: 't-5', title: 'تکمیل شده', description: 'تحویل بار در انبار تایید شد.', timestamp: '۱۴۰۳/۰۷/۰۳ - ۱۰:۰۰', status: 'completed' },
    ],
  },
  {
    id: 'ord-6540',
    orderNumber: 'PP-1403-6540',
    date: '۱۴۰۳/۰۶/۲۵ - ۱۶:۴۵',
    status: 'cancelled',
    statusLabel: 'لغو شده',
    storeName: 'بازرگانی دهقان (پرشین پارت تهران)',
    customerName: 'آرش دهقان',
    customerPhone: '۰۹۱۲۳۴۵۶۷۸۹',
    deliveryAddress: 'تهران، بزرگراه فتح، پلاک ۱۴',
    deliveryMethod: 'باربری اختصاصی',
    notes: 'به درخواست خریدار جهت اصلاح متراژ لغو گردید.',
    items: [
      {
        productId: 'prod-4',
        productName: 'پرسلان مشکی مارکینا رگه‌دار',
        productSlug: 'nero-marquina-100100-polish',
        productSku: 'PP-NER-1010-POL',
        productImage: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=300&q=80',
        dimension: '100×100',
        unitPrice: 750000,
        requestedArea: 20.0,
        cartonCount: 10,
        deliverableArea: 20.0,
        totalPrice: 15000000,
      },
    ],
    subtotal: 15000000,
    discountAmount: 0,
    taxAmount: 1350000,
    finalTotal: 16350000,
    timeline: [
      { id: 't-1', title: 'ثبت سفارش', description: 'سفارش ثبت گردید.', timestamp: '۱۴۰۳/۰۶/۲۵ - ۱۶:۴۵', status: 'completed' },
      { id: 't-2', title: 'لغو سفارش', description: 'سفارش توسط مشتری لغو شد.', timestamp: '۱۴۰۳/۰۶/۲۵ - ۱۷:۱۰', status: 'cancelled' },
    ],
  },
]
