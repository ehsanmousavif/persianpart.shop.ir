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
  const [content, setContent] = useState('')
  const [customerId, setCustomerId] = useState(customers[0]?.id || '')
  const [planType, setPlanType] = useState<'credit_terms' | 'product_discount'>('credit_terms')
  const [discountPercent, setDiscountPercent] = useState<number>(10)
  const [status, setStatus] = useState<'active' | 'expired' | 'draft'>('active')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (editingPlan) {
      setTitle(editingPlan.title)
      setContent(editingPlan.content || editingPlan.notes || '')
      setCustomerId(editingPlan.customerId)
      setPlanType(editingPlan.type || 'credit_terms')
      setDiscountPercent(editingPlan.discountPercent ?? 10)
      setStatus(editingPlan.status || (editingPlan.isActive ? 'active' : 'expired'))
      setSelectedProductIds(editingPlan.productIds)
      setNotes(editingPlan.notes || '')
    } else {
      setTitle('')
      setContent('')
      setCustomerId(customers[0]?.id || '')
      setPlanType('credit_terms')
      setDiscountPercent(10)
      setStatus('active')
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

  const selectedCustomer = customers.find((c) => c.id === customerId)
  const defaultDynamicTitle = selectedCustomer
    ? `${selectedCustomer.name} عزیز، این طرح برای شماست`
    : 'همکار عزیز، این طرح برای شماست'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !customerId) return

    const cust = customers.find((c) => c.id === customerId)
    const finalTitle = title.trim() || defaultDynamicTitle

    onSave({
      id: editingPlan?.id,
      title: finalTitle,
      customerGreeting: defaultDynamicTitle,
      customerId,
      customerName: cust ? `${cust.name} (${cust.company})` : '',
      type: planType,
      discountPercent: planType === 'product_discount' ? Number(discountPercent) || 10 : undefined,
      isActive: status === 'active',
      status,
      content: content.trim(),
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
        {/* Customer Selection: Customer [ Select Customer ▼ ] */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            کاربر هدف (لیست Userها): <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full h-10 px-3 pe-8 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-bold text-slate-900 transition-all outline-hidden bg-white appearance-none cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.company} ({c.phone})
                </option>
              ))}
            </select>
            <div className="absolute end-3 top-3 pointer-events-none text-slate-400 text-xs font-bold">
              ▼
            </div>
          </div>
        </div>

        {/* Plan Title (Dynamic preview if empty) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            عنوان طرح (اسم): <span className="text-slate-400 font-normal">(اختیاری - خودکار ساخته می‌شود)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={defaultDynamicTitle}
            className="w-full h-10 px-3 rounded-xl border border-slate-300 focus:border-blue-600 text-xs font-bold text-slate-900 transition-all outline-hidden bg-slate-50/50"
          />
          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
            <span>عنوان داینامیک:</span>
            <span className="font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              {title || defaultDynamicTitle}
            </span>
          </div>
        </div>

        {/* Plan Type Selector (Credit Terms vs Product Discount) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            نوع طرح تجاری: <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPlanType('credit_terms')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-start flex flex-col gap-1 cursor-pointer ${
                planType === 'credit_terms'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <span>💳</span>
                <span>شرایط اعتباری و مدت‌دار</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500 leading-tight">
                ثبت مهلت پرداخت و تسویه مدت‌دار (مثلاً ۳ ماهه) در متن طرح
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPlanType('product_discount')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-start flex flex-col gap-1 cursor-pointer ${
                planType === 'product_discount'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <span>🏷️</span>
                <span>تخفیف روی کالاها</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500 leading-tight">
                اعمال مستقیم درصد تخفیف روی اقلام منتخب در کاتالوگ
              </span>
            </button>
          </div>
        </div>

        {/* If product_discount mode: Show Discount Percent setting */}
        {planType === 'product_discount' && (
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/90 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900">
                درصد تخفیف اعمالی روی کالاها:
              </label>
              <span className="text-xs font-black text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300">
                {toPersianDigits(discountPercent)}٪ تخفیف
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={50}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-16 h-8 text-center text-xs font-bold rounded-lg border border-emerald-300 bg-white focus:outline-emerald-500"
                />
                <span className="text-xs font-bold text-emerald-800">٪</span>
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 leading-tight">
              این تخفیف در کاتالوگ و سبد خرید خریدار منتخب اعمال شده و قیمت‌های کالا با نشان تخفیف ویژه به روز می‌شوند.
            </p>
          </div>
        )}

        {/* Content (Textarea) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            متن پیام طرح (Textarea): <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              planType === 'credit_terms'
                ? 'مثال: امکان خرید اعتباری با بازپرداخت ۳ ماهه و ارائه چک صیادی...'
                : 'مثال: به پاس همکاری‌های مستمر، ۱۰٪ تخفیف مازاد برای این اقلام به مدت محدود فعال شد...'
            }
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-xs text-slate-900 transition-all outline-hidden bg-slate-50/50"
          />
          <span className="text-xs text-slate-500 mt-0.5 block">
            متنی که برای کاربر در این طرح ارسال یا نمایش داده می‌شود.
          </span>
        </div>

        {/* Status: Active / Expired / Draft */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            وضعیت طرح (Status): <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'active', label: 'در حال اجرا', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
              { val: 'expired', label: 'منقضی شده', color: 'border-amber-500 bg-amber-50 text-amber-800' },
              { val: 'draft', label: 'پیش‌نویس', color: 'border-slate-400 bg-slate-100 text-slate-700' },
            ].map((st) => (
              <button
                key={st.val}
                type="button"
                onClick={() => setStatus(st.val as any)}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  status === st.val
                    ? `${st.color} shadow-xs font-bold ring-2 ring-offset-1 ring-blue-500`
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products in Plan Selection (Independent Relation from Tags) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800">
              انتخاب کالاهای شامل طرح (Select Products):
            </label>
            <span className="text-xs font-semibold text-blue-600">
              {toPersianDigits(selectedProductIds.length)} انتخاب شده
            </span>
          </div>
          <span className="text-xs text-slate-500 block pb-1">
            این رابطه مستقلاً برای هر طرح تنظیم می‌شود و ارتباطی با تگ‌های عمومی محصول ندارد.
          </span>

          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1 bg-white">
            {allProducts.map((product) => {
              const isChecked = selectedProductIds.includes(product.id)
              const originalPrice = product.finalCustomerPricePerSqm
              const discountedPrice =
                planType === 'product_discount'
                  ? Math.round(originalPrice * (1 - (discountPercent || 10) / 100))
                  : originalPrice

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
                    <span className="text-xs text-slate-500">
                      {product.brand} · {toPersianDigits(product.dimension)}
                    </span>
                  </div>
                  <div className="text-end shrink-0">
                    {planType === 'product_discount' && isChecked ? (
                      <div>
                        <span className="text-[10px] text-slate-400 line-through block">
                          {formatToman(originalPrice)}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 block">
                          {formatToman(discountedPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-700">
                        {formatToman(originalPrice)}
                      </span>
                    )}
                  </div>
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
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <CheckIcon size={16} />
            <span>{editingPlan ? 'ذخیره تغییرات' : 'ثبت طرح'}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
