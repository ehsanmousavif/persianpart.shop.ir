import type { Plan } from '../../lib/mock-data/plans'
import type { Product } from '../../lib/mock-data/products'
import { toPersianDigits, formatToman } from '../../lib/utils/currency'
import { StoreIcon, BoxIcon } from '../../components/ui/icons'

export interface PlanCardProps {
  plan: Plan
  products: Product[]
  onToggleStatus: (planId: string) => void
  onEdit: (plan: Plan) => void
}

export function PlanCard({
  plan,
  products,
  onToggleStatus,
  onEdit,
}: PlanCardProps) {
  const planProducts = plan.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 text-start transition-all hover:shadow-sm">
      {/* Top Header: Title, Status Toggle & Edit */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Active / Inactive Badge with Direct Toggle */}
            <button
              type="button"
              onClick={() => onToggleStatus(plan.id)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                plan.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  plan.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <span>{plan.isActive ? 'فعال' : 'غیرفعال'}</span>
            </button>

            <span className="text-[10px] text-slate-400 font-medium">
              ثبت: {toPersianDigits(plan.createdAt)}
            </span>
          </div>

          <h3 className="text-sm font-black text-slate-900 leading-snug">
            {plan.title}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          ویرایش
        </button>
      </div>

      {/* Dynamic Variable Message Box */}
      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-900">
          <span>پیام متغیر طرح (Customer Greeting):</span>
          <span className="font-mono text-[10px] text-blue-600 bg-white px-1.5 py-0.2 rounded border border-blue-200">
            Dynamic
          </span>
        </div>
        <p className="text-xs font-bold text-slate-800 leading-relaxed">
          «{plan.customerGreeting}»
        </p>
        {plan.notes && (
          <p className="text-[11px] text-slate-600 pt-1 border-t border-blue-100/70">
            {plan.notes}
          </p>
        )}
      </div>

      {/* Customer Info */}
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
        <StoreIcon size={16} className="text-blue-600 shrink-0" />
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 block">مشتری طرف قرارداد:</span>
          <span className="font-bold text-slate-800 truncate block">
            {plan.customerName}
          </span>
        </div>
      </div>

      {/* Products included in this Plan (Independent Relation, NOT tags) */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
            <BoxIcon size={14} className="text-slate-500" />
            <span>محصولات اختصاصی طرح</span>
          </span>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {toPersianDigits(planProducts.length)} محصول
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {planProducts.map((prod) => (
            <div
              key={prod.id}
              className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80"
            >
              <img
                src={prod.images[0]}
                alt={prod.name}
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-slate-900 truncate block">
                  {prod.name}
                </span>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{toPersianDigits(prod.dimension)}</span>
                  <span className="font-bold text-blue-700">
                    {formatToman(prod.finalCustomerPricePerSqm)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
