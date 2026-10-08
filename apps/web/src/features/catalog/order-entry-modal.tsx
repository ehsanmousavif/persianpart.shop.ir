import { useState, useId } from 'react'
import { Modal as HeroUIModal } from '@heroui/react'
import type { Product } from '../../lib/mock-data/products'
import { calculateCartonRequirement } from '../../lib/utils/math'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { useCart } from '../cart/cart-store'
import { toast } from '../../components/feedback/toast'
import {
  XIcon,
  ShoppingCartIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  BoxIcon,
} from '../../components/ui/icons'

export interface OrderEntryModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function OrderEntryModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: OrderEntryModalProps) {
  const inputId = useId()
  const { addItem } = useCart()
  const [requestedArea, setRequestedArea] = useState<number>(35)
  const [isAdding, setIsAdding] = useState(false)

  if (!isOpen || !product) return null

  const calc = calculateCartonRequirement(
    requestedArea,
    product.sqmPerCarton,
    product.finalCustomerPricePerSqm,
    product.inventorySqm
  )

  const isOutOfStock = product.stockStatus === 'out_of_stock' || product.inventorySqm <= 0

  const handleAreaChange = (val: string) => {
    const parsed = parseFloat(val)
    if (isNaN(parsed) || parsed < 0) {
      setRequestedArea(0)
    } else {
      setRequestedArea(parsed)
    }
  }

  const handleAddToCart = () => {
    if (isOutOfStock || calc.isExceedingStock || calc.cartonCount <= 0) return

    setIsAdding(true)
    setTimeout(() => {
      addItem(product, requestedArea)
      setIsAdding(false)
      toast.success(
        'به سبد خرید افزوده شد',
        `${toPersianDigits(calc.cartonCount)} کارتن (${toPersianDigits(calc.deliverableArea)}) از «${product.name}» افزوده شد.`
      )
      onClose()
      if (onSuccess) onSuccess()
    }, 300)
  }

  return (
    <HeroUIModal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <HeroUIModal.Backdrop
        isDismissable
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-backdrop-enter"
      >
        <HeroUIModal.Container className="pointer-events-none w-full max-w-xl h-auto p-0 flex flex-col items-center">
          <HeroUIModal.Dialog className="pointer-events-auto relative w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] z-10 border border-slate-200 overflow-hidden animate-drawer-slide-up sm:animate-modal-enter text-start">
            {/* Handle for mobile */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <HeroUIModal.Header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <BoxIcon size={18} />
                </div>
                <div>
                  <HeroUIModal.Heading className="text-sm font-bold text-slate-900">
                    تعیین متراژ و محاسبه کارتن
                  </HeroUIModal.Heading>
                  <span className="text-xs text-slate-500 font-medium">
                    فروش صرفاً بر مبنای کارتن کامل کارخانه
                  </span>
                </div>
              </div>

              <HeroUIModal.CloseTrigger
                onClick={onClose}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="بستن پنجره سفارش"
              >
                <XIcon size={18} />
              </HeroUIModal.CloseTrigger>
            </HeroUIModal.Header>

            {/* Content Body */}
            <HeroUIModal.Body className="p-4 overflow-y-auto space-y-4 text-start">
          {/* Selected Product Summary Card */}
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-blue-600 block">
                {product.brand} · {product.dimension}
              </span>
              <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                {product.name}
              </h3>
              <div className="text-xs text-slate-500 mt-0.5">
                موجودی انبار: <strong>{toPersianDigits(product.inventorySqm)}</strong> ({toPersianDigits(product.stockCartons)} کارتن)
              </div>
            </div>
            <div className="text-end shrink-0">
              <span className="text-sm font-bold text-blue-700 block">
                {formatToman(product.finalCustomerPricePerSqm)}
              </span>
              <span className="text-xs text-slate-400">هر متر مربع</span>
            </div>
          </div>

          {/* Customer Input: requestedSqm ONLY */}
          <div>
            <label htmlFor={inputId} className="block text-xs font-bold text-slate-800 mb-1.5">
              متراژ مورد نیاز شما:
            </label>
            <div className="relative">
              <input
                id={inputId}
                type="number"
                step="0.1"
                min="0.1"
                value={requestedArea || ''}
                onChange={(e) => handleAreaChange(e.target.value)}
                placeholder="مثال: ۳۵"
                className="w-full h-12 px-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-bold text-lg text-start transition-all outline-hidden bg-white"
              />
            </div>

            {/* Quick Add Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-xs text-slate-500 font-medium">افزودن سریع:</span>
              {[10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRequestedArea((prev) => Math.round((prev + preset) * 10) / 10)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  +{toPersianDigits(preset)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRequestedArea(product.sqmPerCarton)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              >
                ۱ کارتن ({toPersianDigits(product.sqmPerCarton)})
              </button>
            </div>
          </div>

          {/* Carton Calculation Live Preview (Transparent Ceil Breakdown) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 text-xs">
              <span className="font-bold text-slate-800">پیش‌نمایش محاسبه هوشمند کارتن</span>
              <span className="text-xs font-medium text-slate-500">
                هر کارتن = {toPersianDigits(product.sqmPerCarton)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 block mb-0.5">مقدار درخواستی</span>
                <span className="font-bold text-slate-900">
                  {toPersianDigits(calc.requestedArea)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 block mb-0.5">تعداد کارتن (رند به بالا)</span>
                <span className="font-bold text-blue-700">
                  {toPersianDigits(calc.cartonCount)} کارتن
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 block mb-0.5">مقدار واقعی تحویلی</span>
                <span className="font-bold text-slate-900">
                  {toPersianDigits(calc.deliverableArea)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs text-slate-500 block mb-0.5">مازاد بر درخواست</span>
                <span className="font-bold text-slate-600">
                  +{toPersianDigits(calc.extraArea)}
                </span>
              </div>
            </div>

            {/* Price Preview */}
            <div className="pt-2 border-t border-slate-200/70 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 block">مبلغ کل ردیف (بر اساس متراژ تحویلی):</span>
                <span className="text-xs text-slate-600">
                  {toPersianDigits(calc.deliverableArea)} × {formatToman(product.finalCustomerPricePerSqm)}
                </span>
              </div>
              <span className="text-base font-bold text-emerald-700">
                {formatToman(calc.totalPrice)}
              </span>
            </div>
          </div>

          {/* Inventory Validation & Alerts */}
          {isOutOfStock ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangleIcon size={16} className="text-rose-600 shrink-0" />
              <span className="font-bold">این کالا در حال حاضر در انبار ناموجود است.</span>
            </div>
          ) : calc.isExceedingStock ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangleIcon size={16} className="text-rose-600 shrink-0" />
                <span>موجودی کافی نیست!</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                {calc.errorMessage}
              </p>
              <button
                type="button"
                onClick={() => setRequestedArea(calc.maxDeliverableSqm)}
                className="text-xs font-semibold text-rose-900 underline cursor-pointer"
              >
                تنظیم سفارش بر روی حداکثر موجودی ({toPersianDigits(calc.maxDeliverableSqm)})
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2Icon size={16} className="text-emerald-600 shrink-0" />
              <span className="font-medium">
                سهمیه تحویل فوری موجود است ({toPersianDigits(product.stockCartons)} کارتن در انبار).
              </span>
            </div>
          )}

          {/* Action CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || calc.isExceedingStock || calc.cartonCount <= 0 || isAdding}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCartIcon size={18} />
              <span>
                افزودن به سبد خرید ({toPersianDigits(calc.cartonCount)} کارتن ({toPersianDigits(calc.deliverableArea)}))
              </span>
            </button>
          </div>
        </HeroUIModal.Body>
      </HeroUIModal.Dialog>
    </HeroUIModal.Container>
  </HeroUIModal.Backdrop>
</HeroUIModal.Root>
  )
}
