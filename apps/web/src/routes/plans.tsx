import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { usePlans } from '../features/plans/plans-store'
import type { Plan } from '../types'
import { PlanCard } from '../features/plans/plan-card'
import { PlanCardSkeleton } from '../components/ui/skeleton'
import { ClipboardListIcon, ArrowLeftIcon, SparklesIcon } from '../components/ui/icons'

export const Route = createFileRoute('/plans')({
  component: CustomerPlansPage,
})

function CustomerPlansPage() {
  const { plans, allProducts, isLoading } = usePlans()
  const [filterMode] = useState<'all' | 'active'>('all')

  const filteredPlans = (plans as Plan[]).filter((p: Plan) => {
    if (filterMode === 'active') return p.status === 'active' || p.isActive
    return true
  })

  return (
    <div className="w-full  px-3 py-3 space-y-3.5 text-start">
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
      </div>
      {isLoading && plans.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 items-stretch">
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-surface border discount border-border rounded-3xl p-8 text-center space-y-3 shadow-xs">
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
