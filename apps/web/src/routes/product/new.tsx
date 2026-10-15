import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { Slider, NumberField, I18nProvider } from '@heroui/react'
import { useProducts } from '../../features/products/product-store'
import { useProductSelection } from '../../features/products/selection-store'
import type { Product } from '../../types'
import { calculateCartonRequirement } from '../../lib/utils/math'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { PreInvoiceModal } from '../../features/checkout/pre-invoice-modal'
import { toast } from '../../components/feedback/toast'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  Trash2Icon,
  BoxIcon,
  SolarRulerIcon,
  SolarBoxIcon,
  SolarLayersIcon,
  SolarTagIcon,
  TomanIcon,
} from '../../components/ui/icons'
import { useOrders } from '../../features/orders/order-store'

export const Route = createFileRoute('/product/new')({
  component: ProductNewConfigurationPage,
})

function ProductNewConfigurationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchObj = (location.search || {}) as Record<string, any>
  const editOrderId: string | undefined =
    searchObj.editOrderId ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('editOrderId') || undefined
      : undefined)
  const { allProducts } = useProducts()
  const { getOrderById } = useOrders()
  const {
    selectedIds,
    quantities,
    unselectProduct,
    setQuantity,
    clearSelection,
    setBatchSelection,
    reconcileWithProducts,
  } = useProductSelection()

  // Modal state for Pre-Invoice
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)

  // Hydrate from order if editOrderId is provided and selection is empty
  useEffect(() => {
    if (editOrderId && selectedIds.length === 0) {
      const order = getOrderById(editOrderId)
      if (order && order.items && order.items.length > 0) {
        setBatchSelection(
          order.items.map((item) => ({
            id: item.productId,
            quantity: item.requestedArea || item.deliverableArea,
          }))
        )
      }
    }
  }, [editOrderId, selectedIds.length, getOrderById, setBatchSelection])

  // Reconcile selected IDs with live products
  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      reconcileWithProducts(allProducts.map((p) => p.id))
    }
  }, [allProducts, reconcileWithProducts])

  // Selected products resolved from live products database
  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => {
        const cleanId = String(id).replace(/["']/g, '').trim()
        return allProducts.find(
          (p) =>
            String(p.id) === cleanId ||
            p.sku === cleanId ||
            p.slug === cleanId
        )
      })
      .filter((p): p is Product => p !== undefined)
  }, [selectedIds, allProducts])

  // Automatically initialize quantities for new products in selection
  useEffect(() => {
    selectedProducts.forEach((prod) => {
      if (quantities[prod.id] === undefined) {
        setQuantity(prod.id, Math.max(prod.sqmPerCarton || 1, 10))
      }
    })
  }, [selectedProducts, quantities, setQuantity])

  const handleAreaChange = (productId: string, val: number, inventorySqm: number) => {
    const rawVal = isNaN(val) || val < 0 ? 0 : Math.round(val * 10) / 10
    const clampedVal = Math.min(rawVal, inventorySqm)
    setQuantity(productId, clampedVal)
  }

  const handleRemoveProduct = (productId: string) => {
    unselectProduct(productId)
  }

  const handleBackToProducts = () => {
    navigate({
      to: '/product',
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
        <div className="w-16 h-16 rounded-2xl bg-default/20 text-muted flex items-center justify-center mx-auto">
          <BoxIcon size={32} />
        </div>
        <h2 className="text-base font-bold text-foreground">
          محصولی برای تعیین متراژ انتخاب نشده است
        </h2>
        <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
          لطفاً ابتدا به صفحه محصولات مراجعه کرده و با کلیک روی کارت‌ها، کاشی‌های مد نظر خود را انتخاب نمایید.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: '/product' })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
        >
          <ArrowRightIcon size={16} />
          <span>بازگشت به لیست محصولات</span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 py-3 space-y-4 text-start pb-28">
      {/* Top Navigation & Step Indicator */}
      <div className="flex items-center justify-between gap-2 border-b border-separator pb-3">
        <button
          type="button"
          onClick={handleBackToProducts}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-default/15 hover:bg-default/30 text-foreground text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowRightIcon size={14} />
          <span>بازگشت به لیست محصولات</span>
        </button>

       
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
              className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all space-y-3.5 hover:border-primary/40"
            >
              {/* 1. Header Row: Thumbnail + Product Info + Delete Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border bg-default/15">
                    <img
                      src={product.images[0] || '/assets/images/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (!e.currentTarget.src.endsWith('/assets/images/placeholder.svg')) {
                          e.currentTarget.src = '/assets/images/placeholder.svg'
                        }
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-default/15 text-foreground border border-border">
                        {toPersianDigits(product.dimensions.width)} × {toPersianDigits(product.dimensions.height)}
                      </span>
                      <span className="text-xs font-semibold text-muted">
                        {product.brand}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground truncate mt-1">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted mt-0.5 flex-wrap">
                      {/* <span className="font-mono text-foreground font-bold" dir="ltr">{product.sku}</span> */}
                      <span className="inline-flex items-center gap-1">
                        <strong className="font-bold text-foreground">{formatToman(product.finalCustomerPricePerSqm)}</strong>
                        <TomanIcon className="size-4" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(product.id)}
                  className="w-7 h-7 rounded-lg text-muted hover:text-danger hover:bg-danger/15 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
                  title="حذف از لیست"
                  aria-label={`حذف ${product.name}`}
                >
                  <Trash2Icon size={15} />
                </button>
              </div>

              <div className="h-px bg-separator" />

              {/* 2. Meterage Controls: NumberField & Slider */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-foreground block leading-normal">
                      متراژ مورد نیاز:
                    </span>
                    <span className="text-xs text-muted">
                      هر کارتن: <strong className="font-bold text-foreground">{toPersianDigits(product.sqmPerCarton)}</strong>
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
                        <NumberField.Group className="!h-7.5 !min-h-0 !grid-cols-[26px_1fr_26px] rounded-lg border border-border bg-surface shadow-2xs hover:border-border focus-within:!border-primary focus-within:!ring-1 focus-within:!ring-primary/20 transition-colors">
                          <NumberField.DecrementButton className="!w-6.5 !h-6.5 flex items-center justify-center text-muted hover:text-foreground active:scale-90 transition-all rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed [&_svg]:size-3" />
                          <NumberField.Input className="!text-xs font-bold text-center !px-0.5 !py-0 text-foreground !h-full" />
                          <NumberField.IncrementButton className="!w-6.5 !h-6.5 flex items-center justify-center text-muted hover:text-foreground active:scale-90 transition-all rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed [&_svg]:size-3" />
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
                  <div className="flex justify-between items-center text-xs font-semibold text-muted px-0.5">
                    <button
                      type="button"
                      onClick={() => handleAreaChange(product.id, 0, product.inventorySqm)}
                      className="text-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                      ۰
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAreaChange(product.id, product.inventorySqm, product.inventorySqm)}
                      className="text-muted hover:text-foreground hover:underline cursor-pointer"
                    >
                      سقف موجودی: {toPersianDigits(product.inventorySqm)}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Carton Calculation Metrics: 2x2 Clean Grid (Generous Space, No Crushing) */}
              <div className="p-2.5 rounded-xl bg-default/10 border border-border grid grid-cols-2 gap-2 text-xs">
                {/* 1. متراژ انتخابی */}
                <div className="p-2 bg-surface rounded-lg border border-border flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <SolarRulerIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted font-medium block leading-tight mb-1">متراژ انتخابی</span>
                    <span className="font-bold text-foreground text-sm leading-normal truncate block">
                      {toPersianDigits(calc.requestedArea)}
                    </span>
                  </div>
                </div>

                {/* 2. تعداد کارتن */}
                <div className="p-2 bg-surface rounded-lg border border-border flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <SolarBoxIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted font-medium block leading-tight mb-1">تعداد کارتن</span>
                    <span className="font-bold text-primary text-sm leading-normal truncate block">
                      {toPersianDigits(calc.cartonCount)} کارتن
                    </span>
                  </div>
                </div>

                {/* 3. متراژ تحویلی واقعی */}
                <div className="p-2 bg-surface rounded-lg border border-border flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                    <SolarLayersIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted font-medium block leading-tight mb-1">متراژ تحویلی</span>
                    <span className="font-bold text-foreground text-sm leading-normal truncate block">
                      {toPersianDigits(calc.deliverableArea)}
                    </span>
                  </div>
                </div>

                {/* 4. مبلغ برآورد */}
                <div className="p-2 bg-surface rounded-lg border border-border flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-success/15 text-success flex items-center justify-center shrink-0 border border-success/20">
                    <SolarTagIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted font-medium block leading-tight mb-1">مبلغ برآورد</span>
                    <span className="font-bold text-foreground text-sm leading-normal truncate inline-flex items-center gap-1">
                      <span>{formatToman(calc.totalPrice)}</span>
                      <TomanIcon className="size-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky Bottom Bar - ONLY "تایید" Button, Aligned with Container Width */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-surface/95 backdrop-blur-md border-t border-border shadow-2xl z-40 p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={() => setIsInvoiceOpen(true)}
          disabled={!totals.hasValidQuantities}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-98 cursor-pointer select-none touch-manipulation"
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
        editOrderId={editOrderId}
        onSuccess={(orderId) => {
          setIsInvoiceOpen(false)
          clearSelection()
          toast.success(
            'ثبت سفارش',
            'سفارش با موفقیت ثبت شد.'
          )
          navigate({
            to: '/orders/$id',
            params: { id: editOrderId || orderId },
          })
        }}
      />
    </div>
  )
}
