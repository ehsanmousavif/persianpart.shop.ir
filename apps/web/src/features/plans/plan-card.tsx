import { Link } from '@tanstack/react-router'
import type { Plan } from '../../lib/mock-data/plans'
import type { Product } from '../../lib/mock-data/products'
import { toPersianDigits, formatToman } from '../../lib/utils/currency'
import { BoxIcon, ArrowLeftIcon, SparklesIcon, ClockIcon } from '../../components/ui/icons'

export interface PlanCardProps {
  plan: Plan
  products: Product[]
}

export function PlanCard({ plan, products }: PlanCardProps) {
  const planProducts = (plan.productIds || [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))

  const isActive = plan.status === 'active' || (plan.status === undefined && plan.isActive)

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 text-start transition-all hover:shadow-md">
      {/* Top Header: Status Badge & Date */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{isActive ? 'طرح فعال و در حال اجرا' : 'طرح منقضی شده'}</span>
            </span>

            {plan.type === 'product_discount' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1">
                <span>🏷️</span>
                <span>{toPersianDigits(plan.discountPercent || 10)}٪ تخفیف روی کالاها</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs flex items-center gap-1">
                <span>💳</span>
                <span>شرایط اعتباری و مدت‌دار</span>
              </span>
            )}

            {plan.createdAt && (
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <ClockIcon size={12} />
                <span>ثبت: {toPersianDigits(plan.createdAt)}</span>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug flex items-center gap-1.5 pt-0.5">
            <SparklesIcon size={18} className="text-amber-500 shrink-0" />
            <span>{plan.title}</span>
          </h3>
        </div>
      </div>

      {/* Admin Message / Discount Content Box */}
      <div className={`p-4 rounded-2xl border space-y-1.5 ${
        plan.type === 'product_discount'
          ? 'bg-emerald-50/50 border-emerald-200/80'
          : 'bg-blue-50/60 border-blue-100/90'
      }`}>
        <div className={`text-xs font-semibold flex items-center gap-1 ${
          plan.type === 'product_discount' ? 'text-emerald-900' : 'text-blue-900'
        }`}>
          <span>{plan.type === 'product_discount' ? 'شرایط تخفیف اختصاصی:' : 'شرایط پرداخت اعتباری:'}</span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
          {plan.content || plan.notes || 'این طرح تجاری ویژه توسط مدیریت بازرگانی برای حساب شما تعریف شده است.'}
        </p>
      </div>

      {/* Products included in this Plan */}
      {planProducts.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <BoxIcon size={15} className="text-blue-600" />
              <span>کالاهای شامل این طرح</span>
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {toPersianDigits(planProducts.length)} محصول
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {planProducts.map((prod) => {
              const originalPrice = prod.finalCustomerPricePerSqm
              const discountedPrice =
                plan.type === 'product_discount'
                  ? Math.round(originalPrice * (1 - (plan.discountPercent || 10) / 100))
                  : originalPrice

              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate block">
                        {prod.name}
                      </span>
                      {plan.type === 'product_discount' ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-400 line-through">
                            {formatToman(originalPrice)}
                          </span>
                          <span className="text-xs font-bold text-rose-600">
                            {formatToman(discountedPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 block">
                          {toPersianDigits(prod.dimension)} · {formatToman(originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/product"
                    search={{ productname: prod.slug }}
                    className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>سفارش</span>
                    <ArrowLeftIcon size={12} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA Button to order from catalog */}
      {isActive && (
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-xs text-slate-500">
            برای بهره‌مندی از تخفیف و سهمیه این طرح، سفارش خود را ثبت نمایید.
          </span>
          <Link
            to="/product"
            className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
          >
            <span>مشاهده کاتالوگ و ثبت سفارش</span>
            <ArrowLeftIcon size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}
