import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ScrollShadow } from '@heroui/react'
import { usePlans } from '../features/plans/plans-store'
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

  const filteredPlans = plans.filter((p) => {
    if (filterMode === 'active') return p.status === 'active' || p.isActive
    return true
  })

  return (
    <div className="w-full px-3 py-3 space-y-3.5 text-start">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <ClipboardListIcon size={20} className="text-blue-600" />
            <span>طرح‌ها و تخفیف‌های اختصاصی شما</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            پیشنهادات ویژه و تخفیف‌های تجاری تعریف‌شده توسط مدیریت برای حساب شما
          </p>
        </div>

        <button
          type="button"
          onClick={() => refresh?.()}
          className="h-8.5 px-3 rounded-xl border border-slate-200/90 hover:bg-white text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
        >
          <RefreshCwIcon size={13} />
          <span>بروزرسانی</span>
        </button>
      </div>

      {/* Control Bar: Filter Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs">
        <ScrollShadow orientation="horizontal" className="w-full flex items-center gap-1.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`h-7.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه طرح‌ها ({toPersianDigits(plans.length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`h-7.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterMode === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            طرح‌های در حال اجرا ({toPersianDigits(plans.filter((p) => p.status === 'active' || p.isActive).length)})
          </button>
        </ScrollShadow>
      </div>

      {/* Plans List */}
      {isLoading && plans.length === 0 ? (
        <div className="space-y-3.5">
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <SparklesIcon size={26} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-slate-900">
              در حال حاضر طرح فعالی برای حساب شما ثبت نشده است
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              مدیریت بازرگانی به صورت دوره‌ای طرح‌های تشویقی و تخفیف‌های ویژه را برای مشتریان فعال می‌نماید. به محض تخصیص طرح به حساب شما، شرایط آن در این بخش نمایش داده خواهد شد.
            </p>
          </div>
          <Link
            to="/product"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800"
          >
            <span>مشاهده کاتالوگ کالاها</span>
            <ArrowLeftIcon size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
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
