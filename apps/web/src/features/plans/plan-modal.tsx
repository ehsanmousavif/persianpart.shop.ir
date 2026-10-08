import { useState, useEffect } from 'react'
import type { Plan, B2BCustomer } from '../../lib/mock-data/plans'
import type { Product } from '../../lib/mock-data/products'
import { toPersianDigits, formatToman } from '../../lib/utils/currency'
import { Modal } from '../../components/ui/modal'
import { CheckIcon } from '../../components/ui/icons'

export interface PlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (planData: Omit<Plan, 'id' | 'createdAt'> & { id?: string }) => void
  editingPlan?: Plan | null
  customers: B2BCustomer[]
  allProducts: Product[]
}

export function PlanModal({
  isOpen,
  onClose,
  onSave,
  editingPlan,
  customers,
  allProducts,
}: PlanModalProps) {
  const [title, setTitle] = useState('')
  const [customerGreeting, setCustomerGreeting] = useState('')
  const [customerId, setCustomerId] = useState(customers[0]?.id || '')
  const [isActive, setIsActive] = useState(true)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (editingPlan) {
      setTitle(editingPlan.title)
      setCustomerGreeting(editingPlan.customerGreeting)
      setCustomerId(editingPlan.customerId)
      setIsActive(editingPlan.isActive)
      setSelectedProductIds(editingPlan.productIds)
      setNotes(editingPlan.notes || '')
    } else {
      setTitle('')
      setCustomerGreeting('سید احسان عزیز')
      setCustomerId(customers[0]?.id || '')
      setIsActive(true)
      setSelectedProductIds(['prod-9', 'prod-1'])
      setNotes('')
    }
  }, [editingPlan, customers, isOpen])

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const handleCustomerChange = (selectedId: string) => {
    setCustomerId(selectedId)
    const cust = customers.find((c) => c.id === selectedId)
    if (cust && !editingPlan) {
      // Default sample greeting adapted to customer
      setCustomerGreeting(`${cust.name} گرامی`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !customerGreeting.trim() || !customerId) return

    const cust = customers.find((c) => c.id === customerId)
    onSave({
      id: editingPlan?.id,
      title: title.trim(),
      customerGreeting: customerGreeting.trim(),
      customerId,
      customerName: cust ? `${cust.name} (${cust.company})` : '',
      isActive,
      productIds: selectedProductIds,
      notes: notes.trim(),
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPlan ? 'ویرایش طرح تجاری' : 'ایجاد طرح تجاری جدید'}
      isBottomSheetOnMobile={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-start">
        {/* Plan Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            عنوان طرح: <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: طرح همکاری پروژه هتل پارس"
            className="w-full h-10 px-3 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-bold text-slate-900 transition-all outline-hidden bg-slate-50/50"
          />
        </div>

        {/* Customer Selection: Customer [ Select Customer ▼ ] */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            مشتری طرف قرارداد (Customer): <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full h-10 px-3 pe-8 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-bold text-slate-900 transition-all outline-hidden bg-white appearance-none cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.company} ({c.tier})
                </option>
              ))}
            </select>
            <div className="absolute end-3 top-3 pointer-events-none text-slate-400 text-xs font-bold">
              ▼
            </div>
          </div>
        </div>

        {/* Dynamic Variable Greeting (e.g. سید احسان عزیز) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            پیام متغیر طرح (Customer Greeting): <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customerGreeting}
            onChange={(e) => setCustomerGreeting(e.target.value)}
            placeholder="مثال: سید احسان عزیز"
            className="w-full h-10 px-3 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-bold text-slate-900 transition-all outline-hidden bg-slate-50/50 font-sans"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">
            این عبارت به صورت داینامیک در پیام‌های اختصاصی مشتری نمایش داده می‌شود.
          </span>
        </div>

        {/* Status: Active / Inactive Checkbox */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">وضعیت طرح</span>
            <span className="text-[11px] text-slate-500">فعال‌سازی یا تعلیق طرح برای مشتری</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className={`text-xs font-black ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isActive ? 'فعال' : 'غیرفعال'}
            </span>
          </label>
        </div>

        {/* Products in Plan Selection (Independent Relation from Tags) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800">
              انتخاب کالاهای شامل طرح (Select Products):
            </label>
            <span className="text-[11px] font-bold text-blue-600">
              {toPersianDigits(selectedProductIds.length)} انتخاب شده
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block pb-1">
            این رابطه مستقلاً برای هر طرح تنظیم می‌شود و ارتباطی با تگ‌های عمومی محصول ندارد.
          </span>

          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1 bg-white">
            {allProducts.map((product) => {
              const isChecked = selectedProductIds.includes(product.id)
              return (
                <label
                  key={product.id}
                  className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer select-none ${
                    isChecked ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleProduct(product.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-8 h-8 rounded-md object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {product.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {product.brand} · {toPersianDigits(product.dimension)}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-slate-700 shrink-0">
                    {formatToman(product.finalCustomerPricePerSqm)}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            یادداشت داخلی طرح (اختیاری):
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="توضیحات و شرایط ویژه طرح..."
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs text-slate-900 transition-all outline-hidden bg-slate-50/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <CheckIcon size={16} />
            <span>{editingPlan ? 'ذخیره تغییرات' : 'ثبت طرح'}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
