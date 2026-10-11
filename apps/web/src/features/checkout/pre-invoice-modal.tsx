import { useState, useEffect, useMemo } from 'react'
import { Modal as HeroUIModal } from '@heroui/react'
import type { Product } from '../../lib/mock-data/products'
import { calculateCartonRequirement } from '../../lib/utils/math'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { HoldConfirmButton } from '../../components/ui/hold-confirm-button'
import { orderStore } from '../orders/order-store'
import { api } from '../../lib/api-client'
import type { OrderItem } from '../../lib/mock-data/orders'
import {
  XIcon,
  ClockIcon,
  PencilIcon,
} from '../../components/ui/icons'

export interface PreInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  quantities: Record<string, number>
  onSuccess: (orderId: string) => void
}

export function PreInvoiceModal({
  isOpen,
  onClose,
  products,
  quantities,
  onSuccess,
}: PreInvoiceModalProps) {
  // 10-Minute Validity Countdown (600 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(600)

  useEffect(() => {
    if (!isOpen) return

    setSecondsRemaining(600)
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${toPersianDigits(mins.toString().padStart(2, '0'))}:${toPersianDigits(secs.toString().padStart(2, '0'))}`
  }

  // Calculate detailed items and invoice totals
  const invoiceItems = useMemo(() => {
    return products.map((product) => {
      const area = quantities[product.id] ?? 0
      const calc = calculateCartonRequirement(
        area,
        product.sqmPerCarton,
        product.finalCustomerPricePerSqm,
        product.inventorySqm
      )
      return {
        product,
        requestedArea: area,
        cartonCount: calc.cartonCount,
        deliverableArea: calc.deliverableArea,
        unitPrice: product.finalCustomerPricePerSqm,
        totalPrice: calc.totalPrice,
      }
    })
  }, [products, quantities])

  const invoiceTotals = useMemo(() => {
    let totalCartons = 0
    let totalDeliverableArea = 0
    let subtotal = 0
    let discountAmount = 0

    invoiceItems.forEach((item) => {
      totalCartons += item.cartonCount
      totalDeliverableArea += item.deliverableArea
      
      const originalRate = item.product.originalPricePerSqm || item.product.finalCustomerPricePerSqm
      const itemSubtotal = originalRate * item.deliverableArea
      subtotal += itemSubtotal
      if (itemSubtotal > item.totalPrice) {
        discountAmount += (itemSubtotal - item.totalPrice)
      }
    })

    const finalPayable = Math.max(0, subtotal - discountAmount)

    return {
      totalCartons,
      totalDeliverableArea: Math.round(totalDeliverableArea * 100) / 100,
      subtotal,
      discountAmount,
      finalPayable,
    }
  }, [invoiceItems])

  const handleFinalConfirm = async () => {
    const orderItems: OrderItem[] = invoiceItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      productSku: item.product.sku,
      productImage: item.product.images[0],
      dimension: item.product.dimension,
      requestedArea: item.requestedArea,
      cartonCount: item.cartonCount,
      deliverableArea: item.deliverableArea,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }))

    let createdId = ''
    let createdOrderNumber = ''
    try {
      const res: any = await api.order.submit({
        items: invoiceItems.map((item) => ({
          productId: isNaN(Number(item.product.id)) ? item.product.id : Number(item.product.id),
          requestedArea: item.requestedArea,
        })),
        notes: 'ثبت سفارش از کاتالوگ آنلاین',
      })
      if (res?.id) {
        createdId = String(res.id)
        createdOrderNumber = res.orderNumber
      }
    } catch (err) {
      console.warn('Backend order submission fallback:', err)
    }

    const newOrder = orderStore.createOrder({
      id: createdId || undefined,
      orderNumber: createdOrderNumber || undefined,
      items: orderItems,
      subtotal: invoiceTotals.subtotal,
      discountAmount: invoiceTotals.discountAmount,
      taxAmount: Math.round(invoiceTotals.finalPayable * 0.1),
      finalTotal: Math.round(invoiceTotals.finalPayable * 1.1),
      deliveryAddress: 'تهران، انبار مرکزی بازرگانی دهقان',
      notes: 'ثبت سفارش کاتالوگ آنلاین',
    })

    // Slight delay to allow the user to see the complete 360 spin & checkmark animation
    setTimeout(() => {
      onSuccess(newOrder.id)
    }, 450)
  }

  return (
    <HeroUIModal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <HeroUIModal.Backdrop
        isDismissable
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-backdrop-enter"
      >
        <HeroUIModal.Container className="pointer-events-none w-full max-w-2xl h-auto p-0 flex flex-col items-center">
          <HeroUIModal.Dialog className="pointer-events-auto relative w-full bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 border border-slate-200 overflow-hidden animate-modal-enter text-start">
            {/* Header */}
            <HeroUIModal.Header className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div>
                  <HeroUIModal.Heading className="text-sm sm:text-base font-bold text-slate-900">
                    پیش‌فاکتور تایید سفارش
                  </HeroUIModal.Heading>
              
                </div>
              </div>

              <HeroUIModal.CloseTrigger
                onClick={onClose}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="بستن پیش‌فاکتور"
              >
                <XIcon size={18} />
              </HeroUIModal.CloseTrigger>
            </HeroUIModal.Header>

            {/* Scrollable Body */}
            <HeroUIModal.Body className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4">
              {/* 10-Minute Expiration Warning Banner with Stable Non-Jittering Live Countdown */}
              <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-2.5 text-amber-950">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                    <ClockIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs block leading-snug text-amber-950">
                      این فاکتور به مدت ۱۰ دقیقه معتبر است و پس از آن امکان لغو توسط مشتری مقدور نمی‌باشد
                    </span>
                  </div>
                </div>

                {/* Countdown Badge: Invariant Fixed Width (Cannot Resize or Push Text) */}
                <div className="w-[82px] h-8 shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-white border border-amber-300/80 shadow-2xs select-none">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${secondsRemaining < 120 ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                  <span className="font-bold text-xs sm:text-sm text-slate-900 tabular-nums font-mono w-11 text-center" dir="ltr">
                    {formatTimer(secondsRemaining)}
                  </span>
                </div>
              </div>

              {/* Items List (Mobile-styled Cards on all viewports) */}
              <div className="space-y-2.5">
                {invoiceItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2.5 text-xs hover:border-slate-300 transition-colors text-start"
                  >
                    {/* Product Thumbnail & Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-13 h-13 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                        <img
                          src={item.product.images[0] || '/assets/images/placeholder.svg'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (!e.currentTarget.src.endsWith('/assets/images/placeholder.svg')) {
                              e.currentTarget.src = '/assets/images/placeholder.svg'
                            }
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-snug">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200/80 text-[11px]">
                            ابعاد: {toPersianDigits(item.product.dimensions.width)} × {toPersianDigits(item.product.dimensions.height)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 font-medium text-[11px]">{item.product.brand}</span>
                        </div>
                      </div>
                    </div>

                    {/* Calculation Metrics: 3-column bottom strip like mobile */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t -mx-3 -mb-3 px-3 py-2 rounded-b-2xl ">
                      <div className="text-start">
                        <span className=" text-slate-400 block leading-tight">تعداد کارتن</span>
                        <span className="font-bold text-blue-700 ">
                          {toPersianDigits(item.cartonCount)} کارتن
                        </span>
                      </div>

                      <div className="text-center">
                        <span className=" text-slate-400 block leading-tight">متراژ </span>
                        <span className="font-bold text-slate-800 ">
                          {toPersianDigits(item.deliverableArea)} 
                        </span>
                      </div>

                      <div className="text-end">
                        <span className=" text-slate-400 block leading-tight">مبلغ</span>
                        <span className="font-extrabold text-slate-900  ">
                          {formatToman(item.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Summary without dark box */}
              <div className="pt-3 border-t border-slate-200/90 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>مجموع مبلغ اقلام:</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                    {formatToman(invoiceTotals.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">تخفیف:</span>
                  <span className={`font-bold text-xs sm:text-sm ${invoiceTotals.discountAmount > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {invoiceTotals.discountAmount > 0 ? `- ${formatToman(invoiceTotals.discountAmount)}` : '۰ تومان'}
                  </span>
                </div>

                <div className="h-px bg-slate-200 my-1" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">قیمت کل:</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatToman(invoiceTotals.finalPayable)}
                  </span>
                </div>
              </div>
            </HeroUIModal.Body>

            {/* Modal Footer with Two Required Action Buttons */}
            <HeroUIModal.Footer className="p-3 sm:p-4 border-t w-full flex  border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-stretch gap-2.5  w-full">
                {/* Button 1: ویرایش مقادیر */}
                <button
                  type="button"
                  onClick={onClose}
                  className="sm:col-span-4 w-30 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/90 shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                >
                  <PencilIcon size={16} />
                  <span>ویرایش</span>
                </button>

                <div className="sm:col-span-8 flex-1">
                  <HoldConfirmButton
                    onConfirmed={handleFinalConfirm}
                    holdDurationMs={3000}
                    disabled={secondsRemaining === 0 || invoiceItems.length === 0}
                    idleText="تایید نهایی سفارش"
                    holdingText="در حال تایید..."
                    confirmedText="تایید شد"
                  />
                </div>
              </div>
            </HeroUIModal.Footer>
          </HeroUIModal.Dialog>
        </HeroUIModal.Container>
      </HeroUIModal.Backdrop>
    </HeroUIModal.Root>
  )
}
