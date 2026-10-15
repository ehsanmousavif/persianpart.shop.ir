import { Link } from '@tanstack/react-router'
import type { Plan, Product } from '../../types'
import { toPersianDigits, formatToman } from '../../lib/utils/currency'
import { formatPersianDate } from '../../lib/utils/date'
import { BoxIcon, ArrowLeftIcon, SparklesIcon, ClockIcon, TomanIcon } from '../../components/ui/icons'

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
    <div
      className={`p-4 sm:p-5 flex flex-col justify-between gap-4 text-start transition-all h-full rounded-[20px] bg-surface border border-border shadow-xs ${
        !isActive ? 'opacity-85' : ''
      }`}
      style={{ cornerShape: 'squircle', WebkitCornerShape: 'squircle' } as React.CSSProperties}
    >
      <div className="space-y-3.5">
        {/* Top Header: Status Badge & Date */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-success/15 text-success border-success/30 shadow-xs'
                    : 'bg-default/15 text-muted border-border'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-success animate-pulse' : 'bg-muted'
                  }`}
                />
                <span>{isActive ? 'طرح فعال' : 'منقضی شده'}</span>
              </span>

              {plan.type === 'product_discount' ? (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-xs flex items-center gap-1 ${
                    isActive
                      ? 'bg-danger/10 text-danger border-danger/30'
                      : 'bg-default/15 text-muted border-border'
                  }`}
                >
                  <span>{toPersianDigits(plan.discountPercent || 10)}٪ تخفیف</span>
                </span>
              ) : (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-xs flex items-center gap-1 ${
                    isActive
                      ? 'bg-primary/10 text-primary border-primary/25'
                      : 'bg-default/15 text-muted border-border'
                  }`}
                >
                  <span>خرید اعتباری</span>
                </span>
              )}

              {plan.createdAt && (
                <span className="text-xs text-muted font-medium flex items-center gap-1 ms-auto">
                  <ClockIcon size={12} />
                  <span>ثبت: {formatPersianDate(plan.createdAt)}</span>
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug flex items-center gap-1.5 pt-0.5">
              <SparklesIcon size={18} className={isActive ? 'text-warning shrink-0' : 'text-muted shrink-0'} />
              <span className="truncate">{plan.title}</span>
            </h3>
          </div>
        </div>

        {/* Expired State Alert Banner */}
        {!isActive && (
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-between gap-2 text-xs text-warning">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-warning/20 text-warning flex items-center justify-center shrink-0 font-bold text-xs">
                !
              </span>
              <span className="font-semibold text-foreground">مهلت استفاده از این طرح به پایان رسیده است.</span>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-warning/20 text-warning text-[11px] font-bold shrink-0">
              منقضی شده
            </span>
          </div>
        )}

        {/* Admin Message / Discount Content Box */}
        <div
          className={`p-3.5 rounded-xl border space-y-1 ${
            !isActive
              ? 'bg-default/10 border-border text-muted'
              : plan.type === 'product_discount'
                ? 'bg-success/5 border-success/20'
                : 'bg-primary/5 border-primary/20'
          }`}
        >
          <div
            className={`text-xs font-bold flex items-center gap-1 ${
              !isActive
                ? 'text-foreground'
                : plan.type === 'product_discount'
                  ? 'text-success'
                  : 'text-primary'
            }`}
          >
            <span>{plan.type === 'product_discount' ? 'شرایط تخفیف:' : 'شرایط پرداخت:'}</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
            {plan.content || plan.notes || 'شرایط این طرح توسط مدیریت تعیین شده است.'}
          </p>
        </div>

        {/* Products included in this Plan */}
        {planProducts.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs pb-0.5">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <BoxIcon size={15} className="text-primary" />
                <span>کالاهای طرح</span>
              </span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/25">
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
                    className="h-17 flex items-center justify-between gap-2.5 p-2 rounded-xl bg-default/10 hover:bg-default/20 border border-border transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={prod.images[0] || '/assets/images/placeholder.svg'}
                        alt={prod.name}
                        className="w-12 h-12 rounded-[14px] object-cover border border-border shrink-0"
                        style={{ cornerShape: 'squircle', WebkitCornerShape: 'squircle' } as React.CSSProperties}
                        onError={(e) => {
                          const target = e.currentTarget
                          if (!target.src.endsWith('/assets/images/placeholder.svg')) {
                            target.src = '/assets/images/placeholder.svg'
                          }
                        }}
                      />
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <span className="text-xs font-bold text-foreground truncate block">
                          {prod.name}
                        </span>
                        {isActive && plan.type === 'product_discount' ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted line-through inline-flex items-center gap-0.5">
                              <span>{formatToman(originalPrice)}</span>
                              <TomanIcon className="size-2.5" />
                            </span>
                            <span className="text-xs font-bold text-danger inline-flex items-center gap-0.5">
                              <span>{formatToman(discountedPrice)}</span>
                              <TomanIcon className="size-3" />
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted inline-flex items-center gap-1 mt-0.5">
                            <span>{toPersianDigits(prod.dimension)} · {formatToman(originalPrice)}</span>
                            <TomanIcon className="size-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {isActive ? (
                      <Link
                        to="/product"
                        search={{ productname: prod.slug }}
                        className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shrink-0 flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>سفارش</span>
                        <ArrowLeftIcon size={12} />
                      </Link>
                    ) : (
                      <span className="h-8 px-2.5 rounded-lg bg-default/20 text-muted text-xs font-semibold shrink-0 flex items-center justify-center gap-1 cursor-not-allowed">
                        <span>منقضی</span>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer / CTA Section - Pinned to bottom */}
      <div className="mt-auto pt-3 border-t border-separator">
        {isActive ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs text-muted">
              برای بهره‌مندی از تخفیف و سهمیه این طرح، سفارش خود را ثبت نمایید.
            </span>
            <Link
              to="/product"
              className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <span>مشاهده محصولات و ثبت سفارش</span>
              <ArrowLeftIcon size={14} />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-muted">
            <span>این طرح بایگانی شده است و مهلت بهره‌مندی از آن به اتمام رسیده است.</span>
            <span className="font-semibold text-foreground">طرح منقضی</span>
          </div>
        )}
      </div>
    </div>
  )
}
