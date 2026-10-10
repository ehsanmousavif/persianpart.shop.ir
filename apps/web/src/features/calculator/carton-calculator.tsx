import { useState, useId } from 'react'
import type { Product } from '../../lib/mock-data/products'
import { calculateCartonRequirement } from '../../lib/utils/math'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { useCart } from '../cart/cart-store'
import { toast } from '../../components/feedback/toast'
import { ShoppingCartIcon, BoxIcon, AlertTriangleIcon, CheckCircle2Icon } from '../../components/ui/icons'

export interface CartonCalculatorProps {
  product: Product
  onAddedToCart?: () => void
}

export function CartonCalculator({ product, onAddedToCart }: CartonCalculatorProps) {
  const { addItem } = useCart()
  const inputId = useId()
  const [requestedArea, setRequestedArea] = useState<number>(35)
  const [isAdding, setIsAdding] = useState(false)

  const calc = calculateCartonRequirement(
    requestedArea,
    product.areaPerCarton,
    product.pricePerM2
  )

  const isExceedingStock = product.stockCartons > 0 && calc.cartonCount > product.stockCartons
  const isOutOfStock = !product.inStock || product.stockCartons === 0

  const handleAreaChange = (val: string) => {
    const parsed = parseFloat(val)
    if (isNaN(parsed) || parsed < 0) {
      setRequestedArea(0)
    } else {
      setRequestedArea(parsed)
    }
  }


  const handleAddToCart = () => {
    if (isOutOfStock || isExceedingStock || calc.cartonCount <= 0) return

    setIsAdding(true)
    setTimeout(() => {
      addItem(product, requestedArea)
      setIsAdding(false)
      toast.success(
        'به سبد خرید اضافه شد',
        `${toPersianDigits(calc.cartonCount)} کارتن (${toPersianDigits(calc.deliverableArea)}) از «${product.name}» به سبد خرید افزوده شد.`
      )
      if (onAddedToCart) onAddedToCart()
    }, 400)
  }

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-3.5">
      {/* Title */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-xs">
            <BoxIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              محاسبه‌گر متراژ و کارتن تحویلی
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              فروش صرفاً بر اساس کارتن کامل کارخانه
            </span>
          </div>
        </div>
        <div className="text-end">
          <span className="text-xs text-slate-500 font-medium block">هر کارتن:</span>
          <span className="text-sm font-bold text-slate-900">
            {toPersianDigits(product.areaPerCarton)}
          </span>
        </div>
      </div>

      {/* Input Stage: Area required (Meter-based only) */}
      <div>
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 mb-1.5 text-start">
          متراژ مورد نیاز (ارسال صرفاً بر اساس متر مربع):
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
            className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-bold text-base text-start transition-all outline-hidden bg-white"
          />
          <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
            متر مربع
          </span>
        </div>

        {/* Quick Presets for Mobile */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-xs text-slate-500 font-medium">افزودن سریع:</span>
          {[5, 10, 25, 50, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRequestedArea((prev) => Math.round((prev + preset) * 10) / 10)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 hover:border-blue-400 text-xs font-semibold text-slate-700 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              +{toPersianDigits(preset)} متر
            </button>
          ))}
        </div>
      </div>

      {/* Round-Up Notice Banner */}
      {!calc.isExactMultiple && calc.requestedArea > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <AlertTriangleIcon size={16} className="text-amber-600 shrink-0" />
            <span>هشدار رُند شدن به بالا (بسته‌بندی کارخانه‌ای)</span>
          </div>
          <p className="text-xs leading-relaxed text-amber-900">
            متراژ انتخابی شما ({toPersianDigits(calc.requestedArea)} متر) مضرب کامل کارتن نیست. سفارش شما{' '}
            <strong className="text-amber-950 font-black underline decoration-amber-400">
              به اندازه {toPersianDigits(calc.extraArea)} متر مربع به بالا رُند شد
            </strong>{' '}
            و معادل <strong>{toPersianDigits(calc.deliverableArea)} متر مربع</strong> ({toPersianDigits(calc.cartonCount)} کارتن پلمپ) به مبلغ کل {formatToman(calc.totalPrice)} محاسبه و ارسال خواهد شد.
          </p>
        </div>
      )}

      {/* Result Cards Breakdown (Slides metric style) */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block leading-tight mb-0.5">تعداد کارتن</span>
          <span className="text-sm font-bold text-blue-700">
            {toPersianDigits(calc.cartonCount)} کارتن
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block leading-tight mb-0.5">متراژ تحویلی</span>
          <span className="text-sm font-bold text-slate-900">
            {toPersianDigits(calc.deliverableArea)}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block leading-tight mb-0.5">مازاد پرت کارتن</span>
          <span className="text-sm font-bold text-slate-700">
            {toPersianDigits(calc.extraArea)}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block leading-tight mb-0.5">مبلغ کل برآورد</span>
          <span className="text-sm font-bold text-emerald-700 truncate block">
            {formatToman(calc.totalPrice)}
          </span>
        </div>
      </div>

      {/* Stock warning if applicable */}
      {isOutOfStock ? (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangleIcon size={16} className="shrink-0 text-rose-600" />
          <span className="font-semibold">این محصول در حال حاضر در انبار ناموجود است.</span>
        </div>
      ) : isExceedingStock ? (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangleIcon size={16} className="shrink-0 text-amber-600" />
            <span>
              موجودی: <strong>{toPersianDigits(product.stockCartons)}</strong> کارتن
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRequestedArea(Math.round(product.stockCartons * product.areaPerCarton * 100) / 100)}
            className="text-xs font-bold text-amber-900 underline cursor-pointer"
          >
            تنظیم به سقف انبار
          </button>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
          <CheckCircle2Icon size={15} className="text-emerald-600 shrink-0" />
          <span>
            سهمیه موجود است ({toPersianDigits(product.stockCartons)} کارتن در انبار آماده بارگیری).
          </span>
        </div>
      )}

      {/* Primary CTA */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock || isExceedingStock || calc.cartonCount <= 0 || isAdding}
        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingCartIcon size={18} />
        <span>افزودن به سبد خرید ({toPersianDigits(calc.cartonCount)} کارتن)</span>
      </button>
    </div>
  )
}
