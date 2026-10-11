import { useState, useMemo, useEffect } from 'react'
import { Modal as HeroUIModal, Chip } from '@heroui/react'
import type { Product } from '../../lib/mock-data/products'
import { toPersianDigits, formatToman } from '../../lib/utils/currency'
import { ImageViewerModal } from '../../components/ui/image-viewer-modal'
import { formatGrade } from './catalog-store'
import {
  XIcon,
  ZoomInIcon,
  CheckIcon,
  PlusIcon,
  SolarRulerIcon,
  SolarBoxIcon,
  SolarLayersIcon,
  SolarTagIcon,
  SolarShopIcon,
  SolarShieldCheckIcon,
  SolarPaletteIcon,
  SolarScaleIcon,
} from '../../components/ui/icons'

export interface ProductBottomSheetProps {
  product: Product | null
  isOpen: boolean
  isSelected?: boolean
  onClose: () => void
  onToggleSelect?: () => void
  onOrderDirect?: (product: Product) => void
}

interface GalleryMediaItem {
  id: string
  url: string
  label: string
  isSampleWork: boolean
}

export function ProductBottomSheet({
  product,
  isOpen,
  isSelected = false,
  onClose,
  onToggleSelect,
  onOrderDirect,
}: ProductBottomSheetProps) {
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)

  // Consolidate tile angles and sample works into a unified gallery
  const mediaItems: GalleryMediaItem[] = useMemo(() => {
    if (!product) return []
    const items: GalleryMediaItem[] = []
    const seen = new Set<string>()

    const all = [
      ...(product.images || []),
      ...(product.gallery || []),
    ].filter(Boolean)

    all.forEach((url, idx) => {
      if (!seen.has(url)) {
        seen.add(url)
        items.push({
          id: `media-${idx}`,
          url,
          label: idx === 0 ? 'تصویر اصلی' : `نمونه‌کار ${toPersianDigits(idx)}`,
          isSampleWork: idx > 0,
        })
      }
    })

    if (items.length === 0) {
      items.push({
        id: 'placeholder',
        url: '/assets/images/placeholder.svg',
        label: 'تصویر شاخص',
        isSampleWork: false,
      })
    }

    return items
  }, [product])

  // Sync active image when product changes
  useEffect(() => {
    if (product && product.images.length > 0) {
      setActiveImageUrl(product.images[0] ?? null)
    }
  }, [product])

  if (!isOpen || !product) return null

  const isOutOfStock = product.stockStatus === 'out_of_stock'
  const isLowStock = product.stockStatus === 'low_stock'
  const currentHeroUrl = activeImageUrl || product.images[0] || ''
  const currentMediaItem = mediaItems.find((m) => m.url === currentHeroUrl)

  return (
    <>
      <HeroUIModal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
        <HeroUIModal.Backdrop
          isDismissable
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end justify-center animate-backdrop-enter"
        >
          <HeroUIModal.Container className="pointer-events-none w-full max-w-xl mx-auto h-auto p-0 flex flex-col items-center justify-end">
            <HeroUIModal.Dialog className="pointer-events-auto relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col h-[67dvh] max-h-[67dvh] min-h-[67dvh] z-10 border-t border-slate-200 overflow-hidden animate-drawer-slide-up text-start">
              {/* Pull Handle Indicator */}
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-8 h-1 rounded-full bg-slate-300" />
              </div>

              {/* Header (Strictly Top-Right Aligned) */}
              <HeroUIModal.Header className="px-3.5 py-2 border-b border-slate-100 flex items-start justify-between gap-2.5 shrink-0 text-start">
                <div className="min-w-0 flex-1 flex flex-col items-start text-start">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 self-start">
                    {product.category}
                  </span>
                  <HeroUIModal.Heading className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 text-start leading-snug">
                    {product.name}
                  </HeroUIModal.Heading>
                </div>

                <HeroUIModal.CloseTrigger
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
                  aria-label="بستن پنجره جزئیات"
                >
                  <XIcon size={16} />
                </HeroUIModal.CloseTrigger>
              </HeroUIModal.Header>

              {/* Scrollable Body */}
              <HeroUIModal.Body className="p-3.5 overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-3 text-start">
                {/* 1. Main Hero Preview */}
                <div className="space-y-2">
                  <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs group">
                    <img
                      src={currentHeroUrl || '/assets/images/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-300"
                      onError={(e) => {
                        const target = e.currentTarget
                        if (!target.src.endsWith('/assets/images/placeholder.svg')) {
                          target.src = '/assets/images/placeholder.svg'
                        }
                      }}
                    />

                    {/* Lightbox Trigger on Hero Preview */}
                    <button
                      type="button"
                      onClick={() => setZoomImageUrl(currentHeroUrl)}
                      className="absolute bottom-2 end-2 px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1 shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      <ZoomInIcon size={12} />
                      <span>بزرگ‌نمایی</span>
                    </button>

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 start-2 flex items-center gap-1">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-semibold shadow-xs">
                          ناموجود در انبار
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-semibold shadow-xs">
                          موجودی محدود ({toPersianDigits(product.inventorySqm)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-semibold shadow-xs">
                          موجود در انبار
                        </span>
                      )}

                      {currentMediaItem?.isSampleWork && (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[10px] font-semibold shadow-xs">
                          نمونه‌کار اجرایی
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Interactive Thumbnail Cards */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[11px] text-slate-600 font-bold">
                        تصاویر کالا
                      </span>

                      <Chip
                        size="sm"
                        variant="soft"
                        color={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
                        className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isOutOfStock ? (
                          'ناموجود در انبار'
                        ) : (
                          <>
                            موجودی انبار: {toPersianDigits(product.inventorySqm)} متر ({toPersianDigits(product.stockCartons)} کارتن)
                          </>
                        )}
                      </Chip>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                      {mediaItems.map((item) => {
                        const isActive = item.url === currentHeroUrl

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveImageUrl(item.url)}
                            aria-label={item.label}
                            title={item.label}
                            className={`group relative w-13 h-13 sm:w-14 sm:h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer select-none active:scale-95 ${
                              isActive
                                ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-xs scale-[1.03] opacity-100'
                                : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={item.url || '/assets/images/placeholder.svg'}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250"
                              onError={(e) => {
                                const target = e.currentTarget
                                if (!target.src.endsWith('/assets/images/placeholder.svg')) {
                                  target.src = '/assets/images/placeholder.svg'
                                }
                              }}
                            />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Price & Selection Action Strip (Strictly 1-Line, Cleaned per user specs) */}
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-baseline gap-1.5 whitespace-nowrap">
                    {product.discountPercent ? (
                      <>
                        <span className="text-sm font-extrabold text-rose-600">
                          {formatToman(product.finalCustomerPricePerSqm)}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatToman(product.originalPricePerSqm || product.finalCustomerPricePerSqm)}
                        </span>
                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                          {toPersianDigits(product.discountPercent)}٪
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatToman(product.finalCustomerPricePerSqm)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    {onToggleSelect && !isOutOfStock && (
                      <button
                        type="button"
                        onClick={onToggleSelect}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckIcon size={13} className="stroke-[3] text-emerald-600" />
                            <span>انتخاب‌شده</span>
                          </>
                        ) : (
                          <>
                            <PlusIcon size={13} className="stroke-[3]" />
                            <span>افزودن به لیست</span>
                          </>
                        )}
                      </button>
                    )}

                    {onOrderDirect && !isOutOfStock && (
                      <button
                        type="button"
                        onClick={() => onOrderDirect(product)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95 whitespace-nowrap shrink-0"
                      >
                        <span>ثبت سفارش</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Structured Specifications with Solar Icons */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <SolarLayersIcon size={13} />
                    </span>
                    <span>مشخصات فنی</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {/* Dimensions (Solar Ruler) */}
                    <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <SolarRulerIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block leading-tight mb-0.5">ابعاد</span>
                        <span className="font-bold text-slate-900 text-xs leading-normal truncate block">
                          {toPersianDigits(product.dimensions.width)} × {toPersianDigits(product.dimensions.height)}
                        </span>
                      </div>
                    </div>

                    {/* Authoritative sqmPerCarton (Solar Box) */}
                    <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <SolarBoxIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block leading-tight mb-0.5">متراژ در کارتن</span>
                        <span className="font-bold text-blue-700 text-xs leading-normal truncate block">
                          {toPersianDigits(product.sqmPerCarton)}
                        </span>
                      </div>
                    </div>

                    {/* SKU Code (Solar Tag) */}
                    <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <SolarTagIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block leading-tight mb-0.5">شناسه کالا</span>
                        <span className="font-mono font-bold text-slate-800 text-xs leading-normal truncate block" dir="ltr">
                          {product.sku}
                        </span>
                      </div>
                    </div>

                    {/* Pieces per carton (Solar Layers) */}
                    <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <SolarLayersIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block leading-tight mb-0.5">تعداد در کارتن</span>
                        <span className="font-bold text-slate-900 text-xs leading-normal truncate block">
                          {toPersianDigits(product.piecesPerCarton)} برگ
                        </span>
                      </div>
                    </div>

                    {/* Brand & Factory (Solar Shop) */}
                    <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <SolarShopIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block leading-tight mb-0.5">برند</span>
                        <span className="font-bold text-slate-900 text-xs leading-normal truncate block">
                          {product.brand}
                        </span>
                      </div>
                    </div>

                    {/* Grade (Solar Shield Check) */}
                    <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <SolarShieldCheckIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block leading-tight mb-0.5">درجه کیفی</span>
                        <span className="font-bold text-slate-900 text-xs leading-normal truncate block">
                          {formatGrade(product.grade)}
                        </span>
                      </div>
                    </div>

                    {/* Color Spectrum (Solar Palette) */}
                    <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <SolarPaletteIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block leading-tight mb-0.5">رنگ</span>
                        <span className="font-bold text-slate-900 text-xs leading-normal truncate block">
                          {product.color}
                        </span>
                      </div>
                    </div>

                    {/* Weight (Solar Scale) */}
                    <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                        <SolarScaleIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 font-medium block leading-tight mb-0.5">وزن هر کارتن</span>
                        <span className="font-bold text-slate-900 text-xs leading-normal truncate block">
                          {toPersianDigits(product.cartonWeightKg)} کیلوگرم
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Rich Description */}
                {(product.richDescription || product.description) && (
                  <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      توضیحات
                    </span>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {product.richDescription || product.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {product.tags.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-medium">ویژگی‌ها:</span>
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </HeroUIModal.Body>
            </HeroUIModal.Dialog>
          </HeroUIModal.Container>
        </HeroUIModal.Backdrop>
      </HeroUIModal.Root>

      {/* Standalone Image Viewer Lightbox */}
      {zoomImageUrl && (
        <ImageViewerModal
          isOpen={Boolean(zoomImageUrl)}
          onClose={() => setZoomImageUrl(null)}
          imageUrl={zoomImageUrl}
          title={product.name}
        />
      )}
    </>
  )
}
