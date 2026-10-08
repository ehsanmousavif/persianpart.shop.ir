import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCart, type CartDemoMode } from '../features/cart/cart-store'
import { CartItemRow } from '../features/cart/cart-item-row'
import { useOrders } from '../features/orders/order-store'
import { useAuth } from '../features/auth/auth-store'
import { formatToman, toPersianDigits } from '../lib/utils/currency'
import { toast } from '../components/feedback/toast'
import { Modal } from '../components/ui/modal'
import {
  ShoppingCartIcon,
  Trash2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  StoreIcon,
  MapPinIcon,
} from '../components/ui/icons'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const navigate = useNavigate()
  const {
    items,
    demoMode,
    itemCount,
    totalCartons,
    totalArea,
    subtotal,
    discountAmount,
    taxAmount,
    finalTotal,
    hasBlockingIssues,
    clearCart,
    resetCart,
    setDemoMode,
  } = useCart()

  const { createOrder } = useOrders()
  const { user, isAuthenticated } = useAuth()

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCheckoutSubmit = () => {
    if (!isAuthenticated || !user) {
      toast.warning('نیاز به ورود', 'لطفاً ابتدا وارد حساب کاربری شوید.')
      navigate({ to: '/login' })
      return
    }

    if (items.length === 0 || hasBlockingIssues) {
      toast.error('خطای ثبت سفارش', 'امکان ثبت سفارش با اقلام ناموجود وجود ندارد.')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      const orderItems = items.map((i) => ({
        productId: i.productId,
        productName: i.name,
        productSlug: i.slug,
        productSku: i.sku,
        productImage: i.image,
        dimension: i.dimension,
        unitPrice: i.unitPrice,
        requestedArea: i.requestedArea,
        cartonCount: i.cartonCount,
        deliverableArea: i.deliverableArea,
        totalPrice: i.totalPrice,
      }))

      const newOrder = createOrder({
        items: orderItems,
        subtotal,
        discountAmount,
        taxAmount,
        finalTotal,
        deliveryAddress: user.address,
        notes: deliveryNotes,
      })

      setIsSubmitting(false)
      setIsCheckoutModalOpen(false)
      toast.success(
        'سفارش با موفقیت ثبت گردید',
        `شماره پیگیری: ${newOrder.orderNumber} در سامانه ثبت شد.`
      )
      navigate({ to: '/orders/$id', params: { id: newOrder.id } })
    }, 700)
  }

  return (
    <div className="w-full px-3 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <ShoppingCartIcon size={20} className="text-blue-600" />
            <span>سبد خرید و فاکتور B2B</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            بررسی متراژ تحویلی، تخفیف‌های تجاری و صدور پیش‌فاکتور
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
          >
            <Trash2Icon size={13} />
            <span>خالی کردن</span>
          </button>
        )}
      </div>

      {/* Demo Scenario Switcher */}
      <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>شبیه‌ساز سناریوهای بازار:</span>
          </span>
          <button
            type="button"
            onClick={resetCart}
            className="text-[10px] text-slate-300 hover:text-white underline cursor-pointer"
          >
            ریست سبد
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {(
            [
              { key: 'normal', label: '✓ عادی' },
              { key: 'low_stock', label: '⚠ کمبود انبار' },
              { key: 'out_of_stock', label: '✕ ناموجود' },
              { key: 'price_changed', label: '↑ تغییر نرخ' },
              { key: 'empty', label: '∅ خالی' },
            ] as { key: CartDemoMode; label: string }[]
          ).map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setDemoMode(btn.key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95 ${
                demoMode === btn.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Cart Content */}
      {items.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingCartIcon size={28} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              سبد خرید شما در حال حاضر خالی است
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              جهت انتخاب کاشی، پرسلان و اسلب‌های پروژه، به کاتالوگ محصولات مراجعه فرمایید.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/product"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              مشاهده کاتالوگ محصولات
            </Link>
            <button
              type="button"
              onClick={resetCart}
              className="w-full py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              بارگذاری اقلام نمونه دمو
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Cart Items List */}
          <div className="space-y-2">
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </div>

          {/* Invoice Summary Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs space-y-2.5">
            <h3 className="text-xs font-black text-slate-900 pb-2 border-b border-slate-100">
              خلاصه صورت‌حساب تجاری
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>تعداد اقلام انتخابی:</span>
                <span className="font-bold text-slate-900">{toPersianDigits(itemCount)} ردیف</span>
              </div>

              <div className="flex justify-between">
                <span>مجموع کارتن‌های سفارش:</span>
                <span className="font-bold text-slate-900">{toPersianDigits(totalCartons)} کارتن</span>
              </div>

              <div className="flex justify-between">
                <span>مجموع متراژ تحویلی:</span>
                <span className="font-bold text-slate-900">{toPersianDigits(totalArea)}</span>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex justify-between">
                <span>جمع کل اقلام (ناخالص):</span>
                <span className="font-bold text-slate-900">{formatToman(subtotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-bold">
                <span>تخفیف همکاری تجاری (۵٪):</span>
                <span>- {formatToman(discountAmount)}</span>
              </div>

              <div className="flex justify-between">
                <span>مالیات بر ارزش افزوده (۱۰٪):</span>
                <span className="font-medium text-slate-700">{formatToman(taxAmount)}</span>
              </div>
            </div>

            <div className="pt-2 border-t-2 border-slate-200/80 flex items-baseline justify-between">
              <span className="text-xs font-black text-slate-900">مبلغ نهایی فاکتور:</span>
              <span className="text-lg font-black text-blue-700">
                {formatToman(finalTotal)}
              </span>
            </div>

            {hasBlockingIssues && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
                <AlertTriangleIcon size={15} className="text-rose-600 shrink-0" />
                <span>لطفاً پیش از ثبت سفارش، کالای ناموجود را حذف فرمایید.</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(true)}
              disabled={hasBlockingIssues || items.length === 0}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>تأیید و ادامه ثبت سفارش</span>
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal (Bottom Sheet on Mobile) */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title="تأیید نهایی و صدور حواله سفارش"
        isBottomSheetOnMobile={true}
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <StoreIcon size={16} className="text-blue-600" />
              <span>{user?.storeName || 'پخش بازرگانی پرشین پارت'}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <MapPinIcon size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <span>{user?.address || 'تهران، بزرگراه فتح، انبار مرکزی'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 text-start">
              توضیحات و هماهنگی بارگیری (اختیاری):
            </label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="مثال: تحویل قبل از ساعت ۱۲ ظهر با هماهنگی تلفنی..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-600 text-xs text-slate-900 transition-all outline-hidden bg-slate-50/50"
            />
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between font-bold text-emerald-900">
              <span>مبلغ نهایی قابل تسویه:</span>
              <span className="text-sm font-black">{formatToman(finalTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 text-[11px]">
              <span>شیوه تسویه:</span>
              <span>اعتبار تجاری باز ۶۰ روزه پرشین پارت</span>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(false)}
              className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              بازگشت به سبد
            </button>
            <button
              type="button"
              onClick={handleCheckoutSubmit}
              disabled={isSubmitting}
              className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCwIcon size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2Icon size={16} />
                  <span>ثبت قطعی سفارش</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
