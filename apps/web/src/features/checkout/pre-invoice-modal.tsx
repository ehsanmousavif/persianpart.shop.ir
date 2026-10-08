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
  FileTextIcon,
  BoxIcon,
  LayersIcon,
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
    let totalPrice = 0

    invoiceItems.forEach((item) => {
      totalCartons += item.cartonCount
      totalDeliverableArea += item.deliverableArea
      totalPrice += item.totalPrice
    })

    return {
      totalCartons,
      totalDeliverableArea: Math.round(totalDeliverableArea * 100) / 100,
      totalPrice,
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
      subtotal: invoiceTotals.totalPrice,
      discountAmount: 0,
      taxAmount: Math.round(invoiceTotals.totalPrice * 0.1),
      finalTotal: Math.round(invoiceTotals.totalPrice * 1.1),
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
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 shadow-2xs">
                  <FileTextIcon size={18} />
                </span>
                <div>
                  <HeroUIModal.Heading className="text-sm sm:text-base font-bold text-slate-900">
                    پیش‌فاکتور تایید سفارش
                  </HeroUIModal.Heading>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span>بازرگانی پرشین پارت</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" dir="ltr">
                      PP-1403-9021
                    </span>
                    <span>•</span>
                    <span>{toPersianDigits(invoiceItems.length)} ردیف انتخابی</span>
                  </div>
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
              {/* 10-Minute Expiration Warning Banner with Live Countdown */}
              <div className="p-3 sm:p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-3 text-amber-950">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                    <ClockIcon size={18} />
                  </div>
                  <div className="leading-tight min-w-0">
                    <span className="font-bold text-xs block">اعتبار پیش‌فاکتور: ۱۰ دقیقه</span>
                    <span className="text-xs text-amber-850 truncate block mt-0.5">
                      برای رزرو سهمیه انبار و تثبیت قیمت، سفارش خود را تایید نمایید.
                    </span>
                  </div>
                </div>

                {/* Countdown Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300/80 shadow-2xs shrink-0">
                  <span className={`w-2 h-2 rounded-full ${secondsRemaining < 120 ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                  <span className="font-bold text-xs sm:text-sm text-slate-900" dir="ltr">
                    {formatTimer(secondsRemaining)}
                  </span>
                </div>
              </div>

              {/* Items Table / Detailed Breakdown */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <LayersIcon size={14} className="text-slate-500" />
                    <span>اقلام پیش‌فاکتور</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {toPersianDigits(invoiceItems.length)} قلم کالا
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {invoiceItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <span>ابعاد: {toPersianDigits(item.product.dimensions.width)}×{toPersianDigits(item.product.dimensions.height)}</span>
                            <span>•</span>
                            <span>{item.product.brand}</span>
                          </div>
                        </div>
                      </div>

                      {/* Calculation metrics */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-center sm:text-end">
                          <span className="text-xs text-slate-500 block">تعداد کارتن</span>
                          <span className="font-bold text-blue-700">
                            {toPersianDigits(item.cartonCount)} کارتن
                          </span>
                        </div>

                        <div className="text-center sm:text-end">
                          <span className="text-xs text-slate-500 block">متراژ تحویلی</span>
                          <span className="font-bold text-slate-800">
                            {toPersianDigits(item.deliverableArea)}
                          </span>
                        </div>

                        <div className="text-end min-w-[90px]">
                          <span className="text-xs text-slate-500 block">مبلغ ردیف</span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {formatToman(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Financial Summary Card */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <BoxIcon size={14} className="text-emerald-400" />
                    <span>مجموع کارتن‌ها:</span>
                  </span>
                  <span className="font-bold text-white text-sm">
                    {toPersianDigits(invoiceTotals.totalCartons)} کارتن ({toPersianDigits(invoiceTotals.totalDeliverableArea)})
                  </span>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-200">جمع کل قابل پرداخت:</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400">
                    {formatToman(invoiceTotals.totalPrice)}
                  </span>
                </div>
              </div>
            </HeroUIModal.Body>

            {/* Modal Footer with Two Required Action Buttons */}
            <HeroUIModal.Footer className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center w-full">
                {/* Button 1: ویرایش مقادیر */}
                <button
                  type="button"
                  onClick={onClose}
                  className="sm:col-span-4 h-13 sm:h-14 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/90 shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                >
                  <PencilIcon size={16} />
                  <span>ویرایش مقادیر</span>
                </button>

                {/* Button 2: تایید نهایی محصول (Hold Button با قفل چرخشی به تیک) */}
                <div className="sm:col-span-8">
                  <HoldConfirmButton
                    onConfirmed={handleFinalConfirm}
                    holdDurationMs={3000}
                    disabled={secondsRemaining === 0 || invoiceItems.length === 0}
                    idleText="تایید نهایی سفارش (۳ ثانیه نگه‌دارید)"
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
