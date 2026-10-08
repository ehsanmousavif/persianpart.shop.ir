import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { usePlans } from '../features/plans/plans-store'
import { PlanCard } from '../features/plans/plan-card'
import { PlanModal } from '../features/plans/plan-modal'
import type { Plan } from '../lib/mock-data/plans'
import { PlusIcon, ClipboardListIcon, RefreshCwIcon } from '../components/ui/icons'
import { toPersianDigits } from '../lib/utils/currency'

export const Route = createFileRoute('/plans')({
  component: PlansPage,
})

function PlansPage() {
  const { plans, customers, allProducts, togglePlanStatus, savePlan, resetToDefault } = usePlans()
  const [filterMode, setFilterMode] = useState<'all' | 'active'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  const filteredPlans = plans.filter((p) => {
    if (filterMode === 'active') return p.isActive
    return true
  })

  const handleOpenCreate = () => {
    setEditingPlan(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setIsModalOpen(true)
  }

  return (
    <div className="w-full px-3 py-3 space-y-3.5 text-start">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <ClipboardListIcon size={20} className="text-blue-600" />
            <span>طرح‌ها و بسته‌های اختصاصی مشتریان (Plans)</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            مدیریت پیام‌های خوش‌آمدگویی پویا و تخصیص مستقیم کالاها به مشتریان
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-sm shadow-blue-600/20 cursor-pointer shrink-0"
        >
          <PlusIcon size={15} />
          <span>طرح جدید</span>
        </button>
      </div>

      {/* Control Bar: Filter Tabs & Reset */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`h-7.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`h-7.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            فقط طرح‌های فعال ({toPersianDigits(plans.filter((p) => p.isActive).length)})
          </button>
        </div>

        <button
          type="button"
          onClick={resetToDefault}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          title="بازنشانی به طرح‌های پیش‌فرض دمو"
        >
          <RefreshCwIcon size={12} />
          <span>ریست دمو</span>
        </button>
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
          <p className="text-xs font-bold text-slate-600">
            هیچ طرحی با فیلتر انتخابی موجود نیست.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="text-xs font-black text-blue-600 hover:underline cursor-pointer"
          >
            ایجاد اولین طرح تجاری
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              products={allProducts}
              onToggleStatus={togglePlanStatus}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* Plan Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={savePlan}
        editingPlan={editingPlan}
        customers={customers}
        allProducts={allProducts}
      />
    </div>
  )
}
