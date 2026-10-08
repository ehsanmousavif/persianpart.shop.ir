import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Slider, NumberField, I18nProvider } from '@heroui/react'
import { MOCK_PRODUCTS, type Product } from '../../lib/mock-data/products'
import { calculateCartonRequirement } from '../../lib/utils/math'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { PreInvoiceModal } from '../../features/checkout/pre-invoice-modal'
import { toast } from '../../components/feedback/toast'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  Trash2Icon,
  BoxIcon,
  LayersIcon,
  SolarRulerIcon,
  SolarBoxIcon,
  SolarLayersIcon,
  SolarTagIcon,
} from '../../components/ui/icons'

interface ProductNewSearch {
  selected?: string
}

export const Route = createFileRoute('/product/new')({
  validateSearch: (search: Record<string, unknown>): ProductNewSearch => {
    return {
      selected: typeof search.selected === 'string' ? search.selected : undefined,
    }
  },
  component: ProductNewConfigurationPage,
})

function ProductNewConfigurationPage() {
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // Modal state for Pre-Invoice
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)

  // Selected product IDs parsed from query params with localStorage fallback
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (searchParams.selected) {
      const parsed = searchParams.selected.split(',').filter(Boolean)
      try {
        localStorage.setItem('persianpart_selected_products', JSON.stringify(parsed))
      } catch {
        // Ignore localStorage errors
      }
      return parsed
    }
    try {
      const saved = localStorage.getItem('persianpart_selected_products')
      if (saved) return JSON.parse(saved)
    } catch {
      // Ignore localStorage errors
    }
    return []
  })

  // Selected products resolved from mock database
  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => MOCK_PRODUCTS.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined)
  }, [selectedIds])

  // Quantities state mapping productId -> area in sqm
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    const ids = searchParams.selected
      ? searchParams.selected.split(',').filter(Boolean)
      : (() => {
          try {
            const saved = localStorage.getItem('persianpart_selected_products')
            return saved ? (JSON.parse(saved) as string[]) : []
          } catch {
            return []
          }
        })()

    ids.forEach((id: string) => {
      const prod = MOCK_PRODUCTS.find((p) => p.id === id)
      if (prod) {
        initial[id] = Math.min(prod.inventorySqm, Math.max(prod.sqmPerCarton, 10))
      }
    })
    return initial
  })

  const handleAreaChange = (productId: string, val: number, inventorySqm: number) => {
    const rawVal = isNaN(val) || val < 0 ? 0 : Math.round(val * 10) / 10
    const clampedVal = Math.min(rawVal, inventorySqm)
    setQuantities((prev) => ({
      ...prev,
      [productId]: clampedVal,
    }))
  }

  const handleRemoveProduct = (productId: string) => {
    const updated = selectedIds.filter((id) => id !== productId)
    setSelectedIds(updated)
    try {
      localStorage.setItem('persianpart_selected_products', JSON.stringify(updated))
    } catch {
      // Ignore localStorage errors
    }
    setQuantities((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    navigate({
      search: (prev) => ({
        ...prev,
        selected: updated.length > 0 ? updated.join(',') : undefined,
      }),
    })
  }

  const handleBackToCatalog = () => {
    navigate({
      to: '/product',
      search: {
        selected: selectedIds.length > 0 ? selectedIds.join(',') : undefined,
      },
    })
  }

  // Calculate totals across all selected products
  const totals = useMemo(() => {
    let totalCartons = 0
    let totalDeliverableArea = 0
    let totalPrice = 0

    selectedProducts.forEach((product) => {
      const area = quantities[product.id] ?? 0
      const calc = calculateCartonRequirement(
        area,
        product.sqmPerCarton,
        product.finalCustomerPricePerSqm,
        product.inventorySqm
      )
      totalCartons += calc.cartonCount
      totalDeliverableArea += calc.deliverableArea
      totalPrice += calc.totalPrice
    })

    return {
      totalCartons,
      totalDeliverableArea: Math.round(totalDeliverableArea * 100) / 100,
      totalPrice,
      hasValidQuantities: selectedProducts.length > 0 && selectedProducts.every((p) => (quantities[p.id] ?? 0) > 0),
    }
  }, [selectedProducts, quantities])

  // Empty State if no products are selected
  if (selectedProducts.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <BoxIcon size={32} />
        </div>
        <h2 className="text-base font-black text-slate-900">
          محصولی برای تعیین متراژ انتخاب نشده است
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          لطفاً ابتدا به صفحه محصولات مراجعه کرده و با کلیک روی کارت‌ها، کاشی‌های مد نظر خود را انتخاب نمایید.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: '/product' })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
        >
          <ArrowRightIcon size={16} />
          <span>بازگشت به کاتالوگ محصولات</span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 py-3 space-y-4 text-start pb-28">
      {/* Top Navigation & Step Indicator */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={handleBackToCatalog}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowRightIcon size={14} />
          <span>بازگشت به کاتالوگ</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black border border-blue-200">
            مرحله ۲ از ۲
          </span>
          <span className="font-extrabold text-slate-800">تعیین متراژ و تایید</span>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
          <LayersIcon size={16} />
        </div>
        <div className="leading-relaxed">
          <span className="font-black block leading-snug">تعیین متراژ:</span>
          متراژ مورد نیاز کالاها را مشخص نموده و دکمه «تایید» را بزنید.
        </div>
      </div>

      {/* List of Selected Products: Structured Cards (Designed for max-w-xl container) */}
      <div className="space-y-4">
        {selectedProducts.map((product) => {
          const area = quantities[product.id] ?? Math.min(product.inventorySqm, Math.max(product.sqmPerCarton, 10))
          const calc = calculateCartonRequirement(
            area,
            product.sqmPerCarton,
            product.finalCustomerPricePerSqm,
            product.inventorySqm
          )

          return (
            <div
              key={product.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all space-y-3.5 hover:border-slate-300"
            >
              {/* 1. Header Row: Thumbnail + Product Info + Delete Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200/80">
                        {toPersianDigits(product.dimensions.width)} × {toPersianDigits(product.dimensions.height)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {product.brand}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {product.finish}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate mt-1">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                      <span className="font-mono text-slate-700 font-bold" dir="ltr">{product.sku}</span>
                      <span>•</span>
                      <span>قیمت پایه: <strong className="font-black text-slate-900">{formatToman(product.finalCustomerPricePerSqm)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(product.id)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
                  title="حذف از لیست"
                  aria-label={`حذف ${product.name}`}
                >
                  <Trash2Icon size={15} />
                </button>
              </div>

              <div className="h-px bg-slate-100" />

              {/* 2. Meterage Controls: NumberField & Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">
                      متراژ مورد نیاز:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      هر کارتن: <strong className="font-bold text-slate-700">{toPersianDigits(product.sqmPerCarton)}</strong>
                    </span>
                  </div>

                  {/* Compact, Persian-Digit NumberField */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <I18nProvider locale="fa-IR">
                      <NumberField
                        minValue={0}
                        maxValue={product.inventorySqm}
                        step={0.1}
                        value={area}
                        onChange={(val) => handleAreaChange(product.id, val, product.inventorySqm)}
                        formatOptions={{ useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 1 }}
                        aria-label={`متراژ ${product.name}`}
                        className="w-28"
                      >
                        <NumberField.Group className="!h-7.5 !min-h-0 !grid-cols-[26px_1fr_26px] rounded-lg border border-slate-200/90 bg-white shadow-2xs hover:border-slate-300 focus-within:!border-slate-400 focus-within:!ring-1 focus-within:!ring-slate-300 transition-colors">
                          <NumberField.DecrementButton className="!w-6.5 !h-6.5 flex items-center justify-center text-slate-500 hover:text-slate-900 active:scale-90 transition-all rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed [&_svg]:size-3" />
                          <NumberField.Input className="!text-xs font-bold text-center !px-0.5 !py-0 text-slate-900 !h-full" />
                          <NumberField.IncrementButton className="!w-6.5 !h-6.5 flex items-center justify-center text-slate-500 hover:text-slate-900 active:scale-90 transition-all rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed [&_svg]:size-3" />
                        </NumberField.Group>
                      </NumberField>
                    </I18nProvider>
                  </div>
                </div>

                {/* Slider */}
                <div dir="ltr" className="space-y-1 pt-0.5">
                  <div className="w-full py-1">
                    <Slider
                      minValue={0}
                      maxValue={product.inventorySqm}
                      step={0.1}
                      value={area}
                      onChange={(val) => {
                        const num = typeof val === 'number' ? val : val[0] ?? 0
                        handleAreaChange(product.id, num, product.inventorySqm)
                      }}
                      aria-label={`اسلایدر متراژ ${product.name}`}
                      className="w-full"
                    >
                      <Slider.Track>
                        <Slider.Fill />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>
                  </div>

                  {/* Presets */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-0.5">
                    <button
                      type="button"
                      onClick={() => handleAreaChange(product.id, 0, product.inventorySqm)}
                      className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      ۰
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAreaChange(product.id, product.inventorySqm, product.inventorySqm)}
                      className="text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      سقف موجودی: {toPersianDigits(product.inventorySqm)}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Carton Calculation Metrics: 2x2 Clean Grid (Generous Space, No Crushing) */}
              <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                {/* 1. متراژ انتخابی */}
                <div className="p-2 bg-white rounded-lg border border-slate-200/60 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
                    <SolarRulerIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">متراژ انتخابی</span>
                    <span className="font-extrabold text-slate-900 text-xs leading-none truncate block">
                      {toPersianDigits(calc.requestedArea)}
                    </span>
                  </div>
                </div>

                {/* 2. تعداد کارتن */}
                <div className="p-2 bg-white rounded-lg border border-slate-200/60 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
                    <SolarBoxIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">تعداد کارتن</span>
                    <span className="font-extrabold text-blue-700 text-xs leading-none truncate block">
                      {toPersianDigits(calc.cartonCount)} کارتن
                    </span>
                  </div>
                </div>

                {/* 3. متراژ تحویلی واقعی */}
                <div className="p-2 bg-white rounded-lg border border-slate-200/60 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
                    <SolarLayersIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">متراژ تحویلی</span>
                    <span className="font-extrabold text-slate-900 text-xs leading-none truncate block">
                      {toPersianDigits(calc.deliverableArea)}
                    </span>
                  </div>
                </div>

                {/* 4. مبلغ برآورد */}
                <div className="p-2 bg-white rounded-lg border border-slate-200/60 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/60">
                    <SolarTagIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">مبلغ برآورد</span>
                    <span className="font-black text-slate-900 text-xs leading-none truncate block">
                      {formatToman(calc.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky Bottom Bar - ONLY "تایید" Button, Aligned with Container Width */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl z-40 p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={() => setIsInvoiceOpen(true)}
          disabled={!totals.hasValidQuantities}
          className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer select-none touch-manipulation"
        >
          <span>تایید</span>
          <ArrowLeftIcon size={16} />
        </button>
      </div>

      {/* Pre-Invoice Modal */}
      <PreInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        products={selectedProducts}
        quantities={quantities}
        onSuccess={(orderId) => {
          setIsInvoiceOpen(false)
          try {
            localStorage.removeItem('persianpart_selected_products')
          } catch {
            // Ignore localStorage errors
          }
          toast.success(
            'ثبت قطعی سفارش',
            `سفارش شما با موفقیت ثبت شد.`
          )
          navigate({
            to: '/orders/$id',
            params: { id: orderId },
          })
        }}
      />
    </div>
  )
}
