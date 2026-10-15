import React from 'react'
import { Link } from '@tanstack/react-router'
import type { CartItem } from './cart-store'
import { useCart } from './cart-store'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { PlusIcon, MinusIcon, Trash2Icon, AlertTriangleIcon, AlertCircleIcon, BoxIcon, TomanIcon } from '../../components/ui/icons'

export interface CartItemRowProps {
  item: CartItem
}

export const CartItemRow = React.memo(function CartItemRow({ item }: CartItemRowProps) {
  const { updateRequestedArea, removeItem } = useCart()

  return (
    <div
      className="p-3 space-y-2.5 rounded-[20px] bg-surface border border-border shadow-xs"
      style={{ cornerShape: 'squircle', WebkitCornerShape: 'squircle' } as React.CSSProperties}
    >
      {/* Warning states banners */}
      {item.statusWarning === 'low_stock' && (
        <div className="p-2 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangleIcon size={15} className="text-warning shrink-0" />
            <span className="text-xs">
              موجودی محدود است (حداکثر <strong>{toPersianDigits(Math.round(item.stockCartons * item.sqmPerCarton * 100) / 100)}</strong> م²).
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              updateRequestedArea(
                item.productId,
                Math.round(item.stockCartons * item.sqmPerCarton * 100) / 100
              )
            }
            className="text-xs font-semibold text-warning underline cursor-pointer shrink-0"
          >
            اصلاح به سقف
          </button>
        </div>
      )}

      {item.statusWarning === 'out_of_stock' && (
        <div className="p-2 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <AlertCircleIcon size={15} className="text-danger shrink-0" />
            <span className="text-xs">این محصول متأسفانه در انبار ناموجود شده است.</span>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="text-xs font-semibold text-danger underline cursor-pointer shrink-0"
          >
            حذف از سبد
          </button>
        </div>
      )}

      {item.statusWarning === 'price_changed' && (
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <AlertCircleIcon size={15} className="text-primary shrink-0" />
            <span className="text-xs inline-flex items-center gap-1">
              <span>قیمت به‌روزرسانی شد ({formatToman(item.oldUnitPrice || 0)}</span>
              <TomanIcon className="size-3" />
              <span>).</span>
            </span>
          </div>
          <span className="text-xs font-semibold text-primary bg-surface px-2 py-0.5 rounded-xl border border-primary/25">
            نرخ جدید
          </span>
        </div>
      )}

      {/* Main Item Row */}
      <div className="flex items-start gap-3">
        {/* Thumbnail: links to /product with productname query to open bottom sheet */}
        <Link
          to="/product"
          search={{ productname: item.slug }}
          className="relative size-18 shrink-0 block hover:opacity-90 transition-opacity"
          title="مشاهده مشخصات کالا در لیست محصولات"
        >
          <img
                  src={item.image || '/assets/images/placeholder.svg'}
            alt={item.name}
            className="size-18 object-cover rounded-[16px] border border-border"
            style={{ cornerShape: 'squircle', WebkitCornerShape: 'squircle' } as React.CSSProperties}
            onError={(e) => {
              const target = e.currentTarget
              if (!target.src.endsWith('/assets/images/placeholder.svg')) {
                target.src = '/assets/images/placeholder.svg'
              }
            }}
          />
        </Link>

        {/* Content and title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <Link
              to="/products"
              search={{ productname: item.slug }}
              className="text-sm font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {item.name}
            </Link>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="w-6 h-6 rounded-lg text-muted hover:text-danger flex items-center justify-center transition-colors cursor-pointer"
              title="حذف از سبد خرید"
              aria-label="حذف از سبد"
            >
              <Trash2Icon size={15} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
            <span className="font-mono" dir="ltr">{item.sku}</span>
            <span>•</span>
            <span>{toPersianDigits(item.dimension)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
            <BoxIcon size={13} className="text-muted" />
            <span>متراژ تحویلی: <strong className="text-foreground">{toPersianDigits(item.deliverableArea)}</strong> م²</span>
            {item.sqmPerCarton > 0 && (
              <span className="text-muted text-[11px]">• ضریب: {toPersianDigits(item.sqmPerCarton)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Meter Stepper & Total Price Row */}
      <div className="pt-2 border-t border-separator flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        {/* Meter Stepper */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-xl bg-default/15 h-8.5 overflow-hidden">
            <button
              type="button"
              onClick={() =>
                updateRequestedArea(
                  item.productId,
                  Math.round(((item.requestedArea || item.deliverableArea) + 1) * 10) / 10
                )
              }
              className="w-8 h-full flex items-center justify-center text-foreground hover:bg-default/25 transition-colors cursor-pointer active:bg-default/35"
              title="افزایش متراژ (متر مربع)"
            >
              <PlusIcon size={14} />
            </button>
            <span
              className="px-2 text-xs font-bold text-foreground select-none min-w-[56px] text-center"
              dir="ltr"
            >
              {toPersianDigits(item.requestedArea || item.deliverableArea)} م²
            </span>
            <button
              type="button"
              onClick={() =>
                updateRequestedArea(
                  item.productId,
                  Math.max(1, Math.round(((item.requestedArea || item.deliverableArea) - 1) * 10) / 10)
                )
              }
              className="w-8 h-full flex items-center justify-center text-foreground hover:bg-default/25 transition-colors cursor-pointer active:bg-default/35"
              title="کاهش متراژ (متر مربع)"
            >
              <MinusIcon size={14} />
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-end">
          <span className="text-xs text-muted block font-medium leading-tight">
            <span className="inline-flex items-center gap-0.5">
              <span>{formatToman(item.unitPrice)}</span>
              <TomanIcon className="size-3" />
            </span>
          </span>
          <span className="text-sm font-bold text-foreground leading-normal inline-flex items-center gap-1">
            <span>{formatToman(item.totalPrice)}</span>
            <TomanIcon className="size-4" />
          </span>
        </div>
      </div>
    </div>
  )
})
