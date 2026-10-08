import { Link } from '@tanstack/react-router'
import type { CartItem } from './cart-store'
import { useCart } from './cart-store'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { PlusIcon, MinusIcon, Trash2Icon, AlertTriangleIcon, AlertCircleIcon, BoxIcon } from '../../components/ui/icons'

export interface CartItemRowProps {
  item: CartItem
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateCartonCount, removeItem } = useCart()

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 transition-all shadow-xs space-y-2.5 text-start">
      {/* Warning states banners */}
      {item.statusWarning === 'low_stock' && (
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangleIcon size={15} className="text-amber-600 shrink-0" />
            <span className="text-xs">
              موجودی محدود است (حداکثر <strong>{toPersianDigits(item.stockCartons)}</strong> کارتن).
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateCartonCount(item.productId, item.stockCartons)}
            className="text-xs font-semibold text-amber-900 underline cursor-pointer shrink-0"
          >
            اصلاح به سقف
          </button>
        </div>
      )}

      {item.statusWarning === 'out_of_stock' && (
        <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <AlertCircleIcon size={15} className="text-rose-600 shrink-0" />
            <span className="text-xs">این محصول متأسفانه در انبار ناموجود شده است.</span>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="text-xs font-semibold text-rose-800 underline cursor-pointer shrink-0"
          >
            حذف از سبد
          </button>
        </div>
      )}

      {item.statusWarning === 'price_changed' && (
        <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <AlertCircleIcon size={15} className="text-blue-600 shrink-0" />
            <span className="text-xs">
              قیمت به‌روزرسانی شد ({formatToman(item.oldUnitPrice || 0)}).
            </span>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
            نرخ جدید
          </span>
        </div>
      )}

      {/* Main Item Row */}
      <div className="flex items-start gap-3">
        {/* Thumbnail: links to /product with productname query to open bottom sheet */}
        <Link
          to="/products"
          search={{ productname: item.slug }}
          className="w-18 h-18 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 block hover:opacity-90 transition-opacity"
          title="مشاهده مشخصات کالا در کاتالوگ"
        >
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </Link>

        {/* Content and title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <Link
              to="/products"
              search={{ productname: item.slug }}
              className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
            >
              {item.name}
            </Link>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
              title="حذف از سبد خرید"
              aria-label="حذف از سبد"
            >
              <Trash2Icon size={15} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span className="font-mono" dir="ltr">{item.sku}</span>
            <span>•</span>
            <span>{toPersianDigits(item.dimension)}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <BoxIcon size={13} className="text-slate-400" />
            <span>متراژ تحویلی: <strong>{toPersianDigits(item.deliverableArea)}</strong></span>
            <span className="text-xs text-slate-500">({toPersianDigits(item.cartonCount)} ک)</span>
          </div>
        </div>
      </div>

      {/* Stepper & Total Price Row */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Stepper */}
        <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 h-8.5 overflow-hidden">
          <button
            type="button"
            onClick={() => updateCartonCount(item.productId, item.cartonCount + 1)}
            className="w-8 h-full flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer active:bg-slate-300"
            title="افزایش تعداد کارتن"
          >
            <PlusIcon size={14} />
          </button>
          <span className="px-2.5 text-xs font-bold text-slate-900 select-none min-w-[46px] text-center">
            {toPersianDigits(item.cartonCount)} ک
          </span>
          <button
            type="button"
            onClick={() => updateCartonCount(item.productId, item.cartonCount - 1)}
            className="w-8 h-full flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer active:bg-slate-300"
            title="کاهش تعداد کارتن"
          >
            <MinusIcon size={14} />
          </button>
        </div>

        {/* Pricing */}
        <div className="text-end">
          <span className="text-xs text-slate-500 block font-medium leading-tight">
            {formatToman(item.unitPrice)}
          </span>
          <span className="text-sm font-bold text-slate-900 leading-normal">
            {formatToman(item.totalPrice)}
          </span>
        </div>
      </div>
    </div>
  )
}
