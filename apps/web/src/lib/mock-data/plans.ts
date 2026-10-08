export interface B2BCustomer {
  id: string
  name: string
  company: string
  phone: string
  tier: 'VIP' | 'تجاری ممتاز' | 'پروژه‌ای'
}

export interface Plan {
  id: string
  title: string
  customerGreeting: string // Dynamic variable greeting, e.g. "سید احسان عزیز"
  customerId: string
  customerName: string
  isActive: boolean
  productIds: string[] // Independent relation from Product Tags
  notes?: string
  createdAt: string
}

export const MOCK_CUSTOMERS: B2BCustomer[] = [
  {
    id: 'cust-1',
    name: 'سید احسان حسینی',
    company: 'بازرگانی کاشی و سرامیک البرز',
    phone: '۰۹۱۲۳۴۵۶۷۸۹',
    tier: 'VIP',
  },
  {
    id: 'cust-2',
    name: 'مهندس کامران رضایی',
    company: 'پروژه برج باغ‌های مروارید',
    phone: '۰۹۱۲۱۱۱۴۴۵۵',
    tier: 'پروژه‌ای',
  },
  {
    id: 'cust-3',
    name: 'حاج رضا کریمی',
    company: 'پخش مصالح ساختمانی اسپادانا (اصفهان)',
    phone: '۰۹۱۳۲۰۰۷۷۸۸',
    tier: 'تجاری ممتاز',
  },
  {
    id: 'cust-4',
    name: 'مهندس آرش طاهری',
    company: 'شرکت مهندسی سازه‌گستر پرشین',
    phone: '۰۹۱۲۵۵۵۶۶۷۷',
    tier: 'پروژه‌ای',
  },
  {
    id: 'cust-5',
    name: 'فروشگاه تایل و اسلب مدرن تبریز',
    company: 'بازرگانی برادران پورمحمد',
    phone: '۰۹۱۴۳۳۳۲۲۱۱',
    tier: 'تجاری ممتاز',
  },
]

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-1',
    title: 'طرح همکاری اختصاصی پروژه برج مروارید',
    customerGreeting: 'سید احسان عزیز',
    customerId: 'cust-1',
    customerName: 'سید احسان حسینی (بازرگانی البرز)',
    isActive: true,
    productIds: ['prod-9', 'prod-1', 'prod-4'],
    notes: 'پکیج کاشی و پرسلان با اولویت بارگیری و تخصیص مستقیم سهمیه انبار مرکزی.',
    createdAt: '۱۴۰۴/۰۷/۱۰',
  },
  {
    id: 'plan-2',
    title: 'طرح اسلب‌های صادراتی شوروم‌های اصفهان',
    customerGreeting: 'جناب آقای کریمی گرامی',
    customerId: 'cust-3',
    customerName: 'حاج رضا کریمی (پخش اسپادانا)',
    isActive: true,
    productIds: ['prod-7', 'prod-2', 'prod-1'],
    notes: 'سبد پرسلان‌های سایز بزرگ لوکس مناسب نمایش در شوروم‌های تخصصی.',
    createdAt: '۱۴۰۴/۰۷/۰۱',
  },
  {
    id: 'plan-3',
    title: 'طرح تأمین سرامیک کف انبوه‌سازی فاز ۳',
    customerGreeting: 'مهندس رضایی محترم',
    customerId: 'cust-2',
    customerName: 'مهندس کامران رضایی (برج مروارید)',
    isActive: false,
    productIds: ['prod-3', 'prod-5', 'prod-8'],
    notes: 'طرح اقتصادی با قیمت تثبیت‌شده برای حجم خرید بالای ۲۰۰۰ مترمربع.',
    createdAt: '۱۴۰۴/۰۶/۱۵',
  },
]
