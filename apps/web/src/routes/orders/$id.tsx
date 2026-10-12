import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Modal as HeroUIModal } from '@heroui/react'
import { useOrders, buildFullOrderTimeline } from '../../features/orders/order-store'
import { ORDER_STATUS_MAP, type Order, type OrderItem, type Product } from '../../types'
import { OrderTimeline } from '../../features/orders/order-timeline'
import { Badge } from '../../components/ui/badge'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { formatPersianDate } from '../../lib/utils/date'
import { toast } from '../../components/feedback/toast'
import { OrderDetailSkeleton } from '../../components/ui/skeleton'
import {
  ArrowRightIcon,
  RefreshCwIcon,
  XIcon,
  StoreIcon,
  MapPinIcon,
  PhoneIcon,
  AlertTriangleIcon,
  ClockIcon,
  TomanIcon,
} from '../../components/ui/icons'
import { PreInvoiceModal } from '../../features/checkout/pre-invoice-modal'
import { useProducts } from '../../features/products/product-store'

export const Route = createFileRoute('/orders/$id')({
  loader: async ({ params }) => {
    return { orderId: params.id }
  },
  component: OrderDetailPage,
})

function cleanOrderNumber(orderNumber: string): string {
  if (!orderNumber) return ''
  const stripped = orderNumber.replace(/^PP-/, '')
  if (/^\d{10,}$/.test(stripped)) {
    return stripped.slice(-6)
  }
  return stripped
}

function OrderDetailPage() {
  const { orderId } = Route.useLoaderData()
  const navigate = useNavigate()
  const {
    getOrderById,
    fetchOrderById,
    cancelOrder,
    orders,
  } = useOrders()
  const { allProducts } = useProducts()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('تغییر در متراژ یا اقلام سفارش')
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false)
  const [order, setOrder] = useState<Order | null>(() => getOrderById(orderId) || null)
  const [isLoading, setIsLoading] = useState(!order)

  // 10-Minute Countdown Timer calculation (calculated purely from order createdAt)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => {
    if (!order) return 0
    const createdAtMs = order.createdAt ? new Date(order.createdAt).getTime() : Date.now()
    const deadline = createdAtMs + 10 * 60 * 1000
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000))
  })

  useEffect(() => {
    let isMounted = true
    const cached = getOrderById(orderId)
    if (cached) {
      setOrder(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    fetchOrderById(orderId).then((res) => {
      if (isMounted) {
        setOrder(res)
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [orderId, orders])

  useEffect(() => {
    if (!order) return
    const createdAtMs = order.createdAt ? new Date(order.createdAt).getTime() : Date.now()
    const deadline = createdAtMs + 10 * 60 * 1000

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
      setTimeLeftSeconds(remaining)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [order?.createdAt])

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${toPersianDigits(mins.toString().padStart(2, '0'))}:${toPersianDigits(secs.toString().padStart(2, '0'))}`
  }

  const isCancelled =
    order?.status === 'cancel' ||
    order?.status === 'cancelled' ||
    order?.status === 'cancelled_by_customer' ||
    order?.status === 'cancelled_by_admin'

  const isCompleted = order?.status === 'completed' || order?.status === 'approved' || order?.status === 'approve'
  const isWithin10Minutes = timeLeftSeconds > 0
  const is10MinutesPassed = timeLeftSeconds <= 0
  const isCancellableByCustomer = !isCancelled && !isCompleted && isWithin10Minutes

  const timeline = useMemo(() => {
    if (!order) return []
    return buildFullOrderTimeline(
      order,
      formatPersianDate(order.createdAt || order.date),
      is10MinutesPassed
    )
  }, [order, is10MinutesPassed])

  const displayStatusLabel = useMemo(() => {
    if (!order) return ''
    if (order.status === 'pending') {
      return is10MinutesPassed ? 'در حال بررسی واحد بازرگانی' : 'سفارش ثبت شده'
    }
    if (order.status === 'approve' || order.status === 'approved' || order.status === 'completed') {
      return 'تکمیل شده'
    }
    if (isCancelled) {
      return order.cancelledBy === 'customer' || order.status === 'cancelled_by_customer'
        ? 'لغو توسط کاربر'
        : 'لغو توسط ادمین'
    }
    return ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP]?.label || order.statusLabel
  }, [order, is10MinutesPassed, isCancelled])

  const statusConfig = order
    ? {
        label: displayStatusLabel,
        color: isCancelled
          ? ('danger' as const)
          : isCompleted
          ? ('success' as const)
          : is10MinutesPassed
          ? ('warning' as const)
          : ('primary' as const),
      }
    : { label: '', color: 'warning' as const }

  // Reorder data for PreInvoiceModal
  const { reorderProducts, reorderQuantities } = useMemo(() => {
    if (!order?.items) return { reorderProducts: [], reorderQuantities: {} }
    const products: Product[] = order.items.map((item) => {
      const found = allProducts.find(
        (p) => String(p.id) === String(item.productId) || p.sku === item.productSku
      )
      if (found) return found
      return {
        id: item.productId,
        slug: item.productSlug || item.productId,
        name: item.productName,
        sku: item.productSku,
        dimension: item.dimension,
        dimensions: { width: 0, height: 0 },
        brand: 'پرشین پارت',
        color: '',
        grade: 'درجه ۱' as const,
        category: 'پرسلان کف' as const,
        finalCustomerPricePerSqm: item.unitPrice,
        pricePerM2: item.unitPrice,
        sqmPerCarton: item.deliverableArea && item.cartonCount ? Math.round((item.deliverableArea / item.cartonCount) * 100) / 100 : 1.44,
        areaPerCarton: item.deliverableArea && item.cartonCount ? Math.round((item.deliverableArea / item.cartonCount) * 100) / 100 : 1.44,
        piecesPerCarton: 4,
        tilesPerCarton: 4,
        cartonWeightKg: 25,
        inventorySqm: 9999,
        stockCartons: 999,
        inStock: true,
        stockStatus: 'in_stock' as const,
        applications: [],
        tags: [],
        images: [item.productImage || '/placeholder.png'],
        gallery: [item.productImage || '/placeholder.png'],
      }
    })
    const quantities: Record<string, number> = {}
    order.items.forEach((item) => {
      quantities[item.productId] = item.requestedArea || item.deliverableArea
    })
    return { reorderProducts: products, reorderQuantities: quantities }
  }, [order?.items, allProducts])

  const handleCancel = async () => {
    if (!order) return
    await cancelOrder(order.id, cancelReason)
    setShowCancelModal(false)
    toast.info('سفارش لغو شد', `سفارش #${toPersianDigits(cleanOrderNumber(order.orderNumber))} با موفقیت لغو شد و موجودی به انبار بازگردانی گردید.`)
    const fresh = await fetchOrderById(order.id)
    if (fresh) setOrder(fresh)
  }

  const handleReorder = () => {
    if (!order) return
    setIsReorderModalOpen(true)
  }

  if (isLoading) {
    return <OrderDetailSkeleton />
  }

  if (!order) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-sm font-bold text-slate-800">سفارش مورد نظر یافت نشد</h2>
        <p className="text-xs text-slate-500">ممکن است این سفارش حذف شده باشد یا به حساب دیگری تعلق داشته باشد.</p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800"
        >
          <ArrowRightIcon size={14} />
          <span>مشاهده همه سفارش‌ها</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full px-3 py-3 space-y-3">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/orders" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ArrowRightIcon size={14} />
          <span>سفارش‌های من</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">سفارش #{toPersianDigits(cleanOrderNumber(order.orderNumber))}</span>
      </nav>

      {/* Main Order Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-sm font-extrabold text-blue-900 flex items-center gap-1.5">
              <span className="text-blue-500 text-xs font-semibold">سفارش</span>
              <span>#{toPersianDigits(cleanOrderNumber(order.orderNumber))}</span>
            </span>
            <Badge variant={statusConfig.color} size="md">
              {displayStatusLabel}
            </Badge>

            {/* 10-Minute Customer Countdown Badge */}
            {!isCancelled && !isCompleted && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-xs ${
                  isWithin10Minutes
                    ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                <ClockIcon size={13} className={isWithin10Minutes ? 'text-amber-700' : 'text-slate-400'} />
                <span>
                  {isWithin10Minutes
                    ? `مهلت لغو خریدار: ${formatCountdown(timeLeftSeconds)}`
                    : 'مهلت ۱۰ دقیقه‌ای لغو پایان یافت'}
                </span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            تاریخ ثبت سفارش: <strong className="text-slate-700">{formatPersianDate(order.createdAt || order.date)}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isCancellableByCustomer && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="py-2.5 px-3.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <XIcon size={16} />
              <span>لغو سفارش</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReorder}
            className="py-2.5 whitespace-nowrap px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCwIcon size={16} />
            <span>سفارش مجدد</span>
          </button>
        </div>
      </div>

      {/* Cancellation Banner */}
      {isCancelled && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangleIcon size={18} className="text-rose-600 shrink-0" />
            <span>
              {order.cancelledBy === 'customer' || order.status === 'cancelled_by_customer'
                ? 'لغو توسط کاربر'
                : 'لغو توسط ادمین'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-rose-900 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-rose-600 font-semibold">ثبت‌کننده لغو:</span>
              <strong className="text-rose-950">
                {order.cancelledBy === 'customer' || order.status === 'cancelled_by_customer'
                  ? 'کاربر'
                  : 'ادمین'}
              </strong>
            </div>
            {order.notes && (
              <div className="flex items-start gap-1.5">
                <span className="text-rose-600 font-semibold shrink-0">علت لغو:</span>
                <span className="text-rose-950 font-medium">{order.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Stepper Timeline */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
          وضعیت سفارش
        </h3>
        <OrderTimeline steps={timeline} />
      </div>

      {/* Products in this order */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>اقلام سفارش</span>
          <span className="text-xs text-slate-400 font-normal">
            {toPersianDigits(order.items.length)} کالا انتخاب شده
          </span>
        </h3>

        <div className="divide-y divide-slate-100">
          {order.items.map((item: OrderItem, idx: number) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link
                  to="/product"
                  search={{ productname: item.productSlug }}
                  className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 block"
                >
                  <img
                    src={item.productImage || '/assets/images/placeholder.svg'}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith('/assets/images/placeholder.svg')) {
                        e.currentTarget.src = '/assets/images/placeholder.svg'
                      }
                    }}
                  />
                </Link>
                <div>
                  <Link
                    to="/product"
                    search={{ productname: item.productSlug }}
                    className="text-sm font-extrabold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                  >
                    {item.productName}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>کد کالا: {toPersianDigits(item.productSku)}</span>
                    <span>•</span>
                    <span>{toPersianDigits(item.dimension)}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    متراژ تحویلی: <strong>{toPersianDigits(item.deliverableArea)}</strong> ({toPersianDigits(item.cartonCount)} کارتن)
                  </div>
                </div>
              </div>

              <div className="text-start sm:text-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 flex flex-col items-start sm:items-end">
                <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                  <span>{formatToman(item.unitPrice)}</span>
                  <TomanIcon className="size-3" />
                </span>
                <span className="text-sm font-bold text-slate-900 inline-flex items-center gap-1">
                  <span>{formatToman(item.totalPrice)}</span>
                  <TomanIcon className="size-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="pt-4 space-y-2 text-xs text-slate-600">
          {order.discountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-700 font-semibold">
              <span>تخفیف:</span>
              <span className="inline-flex items-center gap-1">
                <span>- {formatToman(order.discountAmount)}</span>
                <TomanIcon className="size-3.5" />
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
            <span>مبلغ نهایی:</span>
            <span className="text-base font-bold text-blue-700 inline-flex items-center gap-1">
              <span>{formatToman(order.finalTotal)}</span>
              <TomanIcon className="size-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
          اطلاعات تحویل
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <StoreIcon size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 block">فروشگاه:</span>
              <span className="font-bold text-slate-800">{order.storeName}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <PhoneIcon size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 block">تحویل‌گیرنده:</span>
              <span className="font-bold text-slate-800">
                {order.customerName} ({toPersianDigits(order.customerPhone)})
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPinIcon size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 block">نشانی تحویل:</span>
              <span className="font-bold text-slate-800">{order.deliveryAddress}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 mt-2">
            <strong>یادداشت سفارش:</strong> {order.notes}
          </div>
        )}
      </div>

      {/* HeroUI Cancel Order Confirmation Modal */}
      <HeroUIModal.Root isOpen={showCancelModal} onOpenChange={(open) => !open && setShowCancelModal(false)}>
        <HeroUIModal.Backdrop
          isDismissable
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop-enter"
        >
          <HeroUIModal.Container className="pointer-events-none w-full max-w-sm h-auto p-0 flex flex-col items-center">
            <HeroUIModal.Dialog className="pointer-events-auto relative w-full bg-white rounded-3xl shadow-2xl flex flex-col z-10 border border-slate-200 overflow-hidden animate-modal-enter text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <AlertTriangleIcon size={24} />
              </div>
              <div>
                <HeroUIModal.Heading className="text-base font-bold text-slate-900">
                  لغو سفارش
                </HeroUIModal.Heading>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  آیا از لغو سفارش <strong>#{toPersianDigits(cleanOrderNumber(order.orderNumber))}</strong> در مهلت ۱۰ دقیقه‌ای اطمینان دارید؟
                </p>
                <div className="mt-2.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 text-start">
                  اقلام سفارش به موجودی انبار بازگردانده می‌شوند.
                </div>
              </div>

              {/* Cancellation Reason Selector */}
              <div className="text-start space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  دلیل لغو:
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white outline-hidden cursor-pointer"
                >
                  <option value="تغییر در متراژ یا اقلام سفارش">تغییر در متراژ یا اقلام سفارش</option>
                  <option value="تغییر در زمان‌بندی پروژه و ارسال">تغییر در زمان‌بندی پروژه و ارسال</option>
                  <option value="ثبت اشتباه فاکتور">ثبت اشتباه فاکتور</option>
                  <option value="انصراف موقت خریدار">انصراف موقت خریدار</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer transition-all"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition-all"
                >
                  تأیید لغو سفارش
                </button>
              </div>
            </HeroUIModal.Dialog>
          </HeroUIModal.Container>
        </HeroUIModal.Backdrop>
      </HeroUIModal.Root>

      {/* Pre-Invoice Modal for Reordering */}
      <PreInvoiceModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        products={reorderProducts}
        quantities={reorderQuantities}
        onSuccess={(newOrderId) => {
          setIsReorderModalOpen(false)
          toast.success(
            'ثبت قطعی سفارش مجدد',
            'سفارش مجدد شما با موفقیت ثبت شد.'
          )
          navigate({
            to: '/orders/$id',
            params: { id: newOrderId },
          })
        }}
      />
    </div>
  )
}
