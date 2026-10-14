import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ScrollShadow } from '@heroui/react'
import { usePlans } from '../features/plans/plans-store'
import type { Plan } from '../types'
import { PlanCard } from '../features/plans/plan-card'
import { PlanCardSkeleton } from '../components/ui/skeleton'
import { ClipboardListIcon, RefreshCwIcon, ArrowLeftIcon, SparklesIcon } from '../components/ui/icons'
import { toPersianDigits } from '../lib/utils/currency'

export const Route = createFileRoute('/plans')({
  component: CustomerPlansPage,
})

function CustomerPlansPage() {
  const { plans, allProducts, refresh, isLoading } = usePlans()
  const [filterMode, setFilterMode] = useState<'all' | 'active'>('all')

  const filteredPlans = (plans as Plan[]).filter((p: Plan) => {
    if (filterMode === 'active') return p.status === 'active' || p.isActive
    return true
  })

  return (
    <div className="w-full px-3 py-3 space-y-3.5 text-start">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
            <ClipboardListIcon size={20} className="text-primary" />
            <span>طرح‌ها</span>
          </h1>
          <p className="text-xs text-muted mt-1">
            طرح‌های تشویقی و تخفیف‌های فعال حساب شما
          </p>
        </div>

        <button
          type="button"
          onClick={() => refresh?.()}
          className="h-8.5 px-3 rounded-xl border border-border hover:bg-surface text-foreground text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <RefreshCwIcon size={13} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {/* Control Bar: Filter Tabs */}
      <div className="bg-surface border border-border rounded-2xl p-2 shadow-xs">
        <ScrollShadow orientation="horizontal" className="w-full flex items-center gap-1.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`h-7.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterMode === 'all'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-default/15 text-muted hover:bg-default/30'
            }`}
          >
            همه ({toPersianDigits(plans.length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`h-7.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterMode === 'active'
                ? 'bg-success text-success-foreground shadow-xs'
                : 'bg-default/15 text-muted hover:bg-default/30'
            }`}
          >
            طرح‌های فعال ({toPersianDigits(plans.filter((p) => p.status === 'active' || p.isActive).length)})
          </button>
        </ScrollShadow>
      </div>

      {/* Plans List */}
      {isLoading && plans.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 items-stretch">
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-surface border border-border rounded-3xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto border border-primary/20">
            <SparklesIcon size={26} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-foreground">
              طرح فعالی یافت نشد
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              در حال حاضر طرح یا تخفیف فعالی برای حساب شما وجود ندارد.
            </p>
          </div>
          <Link
            to="/product"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90"
          >
            <span>مشاهده محصولات</span>
            <ArrowLeftIcon size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 items-stretch">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              products={allProducts}
            />
          ))}
        </div>
      )}
    </div>
  )
}
