import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useOrders } from '../../features/orders/order-store'
import { ORDER_STATUS_MAP, type OrderStatus } from '../../lib/mock-data/orders'
import { OrderMiniStepper } from '../../features/orders/order-timeline'
import { Badge } from '../../components/ui/badge'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { toast } from '../../components/feedback/toast'
import {
  PackageIcon,
  RefreshCwIcon,
  ArrowLeftIcon,
  ClockIcon,
} from '../../components/ui/icons'

export const Route = createFileRoute('/orders/')({
  component: OrdersListPage,
})

function OrdersListPage() {
  const navigate = useNavigate()
  const { orders, reorderToCart } = useOrders()
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | OrderStatus>('all')

  const filteredOrders =
    selectedStatusTab === 'all'
      ? orders
      : orders.filter((o) => o.status === selectedStatusTab)

  const handleReorder = (orderId: string) => {
    const res = reorderToCart(orderId)
    if (res.success) {
      if (res.warnings.length > 0) {
        toast.warning('سفارش مجدد', res.warnings.join(' | '))
      } else {
        toast.success('سفارش مجدد', 'اقلام این سفارش به سبد خرید افزوده شد.')
      }
      navigate({ to: '/cart' })
    }
  }

  const TABS = [
    { key: 'all', label: 'همه سفارش‌ها' },
    { key: 'pending', label: 'در انتظار بررسی' },
    { key: 'preparing', label: 'در حال آماده‌سازی' },
    { key: 'completed', label: 'تکمیل شده' },
    { key: 'cancelled', label: 'لغو شده' },
  ] as const

  return (
    <div className="w-full px-3 py-3 space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
          <PackageIcon size={20} className="text-blue-600" />
          <span>سفارش‌ها و سوابق خرید</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          پیگیری وضعیت بارگیری، بارنامه‌ها و ثبت مجدد سفارش‌ها
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const isSelected = selectedStatusTab === tab.key
          const count =
            tab.key === 'all'
              ? orders.length
              : orders.filter((o) => o.status === tab.key).length

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatusTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {toPersianDigits(count)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center shadow-xs space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <PackageIcon size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            سفارشی در این بخش یافت نشد
          </h3>
          <p className="text-xs text-slate-500">
            در این دسته‌بندی هنوز سفارشی برای حساب شما ثبت نگردیده است.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const statusConfig = ORDER_STATUS_MAP[order.status]
            const totalArea = order.items.reduce((s, i) => s + i.deliverableArea, 0)
            const totalCartons = order.items.reduce((s, i) => s + i.cartonCount, 0)

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-3.5 shadow-xs transition-all space-y-3"
              >
                {/* Order Top Bar */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono" dir="ltr">
                      {order.orderNumber}
                    </span>
                    <Badge variant={statusConfig.color} size="sm">
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <ClockIcon size={12} />
                    <span>{order.date}</span>
                  </div>
                </div>

                {/* Items Thumbnails & Specs */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/80 shrink-0"
                        title={item.productName}
                      >
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    <div className="ps-1 text-xs text-slate-600">
                      <span className="font-bold text-slate-900 block text-xs">
                        {toPersianDigits(order.items.length)} ردیف کالا
                      </span>
                      <span className="text-xs text-slate-500">
                        {toPersianDigits(totalCartons)} کارتن ({toPersianDigits(totalArea)})
                      </span>
                    </div>
                  </div>

                  {/* Order Timeline Progress / Position */}
                  {order.timeline && order.timeline.length > 0 && (
                    <OrderMiniStepper steps={order.timeline} />
                  )}

                  {/* Financials & Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-500 block font-medium leading-tight mb-0.5">مبلغ کل فاکتور:</span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatToman(order.finalTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleReorder(order.id)}
                        className="h-8 px-2.5 rounded-xl border border-slate-200/90 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        title="سفارش مجدد اقلام"
                      >
                        <RefreshCwIcon size={13} />
                        <span>تکرار</span>
                      </button>

                      <Link
                        to="/orders/$id"
                        params={{ id: order.id }}
                        className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>پیگیری</span>
                        <ArrowLeftIcon size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
