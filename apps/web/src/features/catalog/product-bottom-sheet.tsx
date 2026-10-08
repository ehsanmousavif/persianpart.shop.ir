import { useState, useMemo, useEffect } from 'react'
import { Modal as HeroUIModal } from '@heroui/react'
import type { Product } from '../../lib/mock-data/products'
import { toPersianDigits, formatToman } from '../../lib/utils/currency'
import { ImageViewerModal } from '../../components/ui/image-viewer-modal'
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
}: ProductBottomSheetProps) {
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)

  // Consolidate tile angles and sample works into a unified HeroUI Pro item-card-group
  const mediaItems: GalleryMediaItem[] = useMemo(() => {
    if (!product) return []
    const items: GalleryMediaItem[] = []

    product.images.forEach((img, idx) => {
      items.push({
        id: `img-${idx}`,
        url: img,
        label: `تصویر ${toPersianDigits(idx + 1)}`,
        isSampleWork: false,
      })
    })

    product.gallery.forEach((sampleImg, idx) => {
      items.push({
        id: `sample-${idx}`,
        url: sampleImg,
        label: `نمونه‌کار ${toPersianDigits(idx + 1)}`,
        isSampleWork: true,
      })
    })

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
          <HeroUIModal.Container className="pointer-events-none w-full max-w-xl h-auto p-0 flex flex-col items-center">
            <HeroUIModal.Dialog className="pointer-events-auto relative w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] z-10 border-t border-slate-200 overflow-hidden animate-drawer-slide-up text-start">
              {/* Pull Handle Indicator */}
              <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-slate-300" />
              </div>

              {/* Header */}
              <HeroUIModal.Header className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="min-w-0 pe-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {product.category}
                  </span>
                  <HeroUIModal.Heading className="text-sm font-black text-slate-900 mt-1 truncate">
                    {product.name}
                  </HeroUIModal.Heading>
                </div>

                <HeroUIModal.CloseTrigger
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  aria-label="بستن پنجره جزئیات"
                >
                  <XIcon size={18} />
                </HeroUIModal.CloseTrigger>
              </HeroUIModal.Header>

              {/* Scrollable Body */}
              <HeroUIModal.Body className="p-4 overflow-y-auto overscroll-contain space-y-4 text-start">
            {/* Unified HeroUI Pro item-card-group Gallery */}
            <div className="space-y-2">
              {/* 1. Main Hero Preview */}
              <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs group">
                <img
                  src={currentHeroUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />

                {/* Lightbox Trigger on Hero Preview */}
                <button
                  type="button"
                  onClick={() => setZoomImageUrl(currentHeroUrl)}
                  className="absolute bottom-2.5 end-2.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  <ZoomInIcon size={14} />
                  <span>بزرگ‌نمایی و زوم</span>
                </button>

                {/* Stock Status Badge */}
                <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                  {isOutOfStock ? (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black shadow-xs">
                      ناموجود در انبار
                    </span>
                  ) : isLowStock ? (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black shadow-xs">
                      موجودی محدود ({toPersianDigits(product.inventorySqm)})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black shadow-xs">
                      موجود در انبار
                    </span>
                  )}

                  {currentMediaItem?.isSampleWork && (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                      نمونه‌کار اجرایی
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Item-Card-Group Strip: Interactive Thumbnail Cards (Pure Photos) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                  <span className="font-bold text-slate-700">تصاویر و نمونه‌کارها</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                  {mediaItems.map((item) => {
                    const isActive = item.url === currentHeroUrl

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveImageUrl(item.url)}
                        aria-label={item.label}
                        title={item.label}
                        className={`group relative w-16 h-16 sm:w-18 sm:h-18 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer select-none active:scale-95 ${
                          isActive
                            ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-md scale-[1.03] opacity-100'
                            : 'border-slate-200/90 hover:border-slate-400 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-250"
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Price & Selection Action Strip */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  قیمت همکاری:
                </span>
                <span className="text-base font-black text-slate-900">
                  {formatToman(product.finalCustomerPricePerSqm)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium ms-1">/ هر متر مربع</span>
              </div>

              {onToggleSelect && !isOutOfStock && (
                <button
                  type="button"
                  onClick={onToggleSelect}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckIcon size={14} className="stroke-[3]" />
                      <span>انتخاب‌شده</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon size={14} className="stroke-[3]" />
                      <span>انتخاب کالا</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Structured Specifications with Solar Icons */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <SolarLayersIcon size={14} />
                </span>
                <span>مشخصات فنی</span>
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Dimensions (Solar Ruler) */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                    <SolarRulerIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">ابعاد</span>
                    <span className="font-extrabold text-slate-900 text-xs leading-none truncate block">
                      {toPersianDigits(product.dimensions.width)} × {toPersianDigits(product.dimensions.height)}
                    </span>
                  </div>
                </div>

                {/* Authoritative sqmPerCarton (Solar Box) */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                    <SolarBoxIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">متراژ در کارتن</span>
                    <span className="font-extrabold text-blue-700 text-xs leading-none truncate block">
                      {toPersianDigits(product.sqmPerCarton)}
                    </span>
                  </div>
                </div>

                {/* SKU Code (Solar Tag) */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                    <SolarTagIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">شناسه کالا (SKU)</span>
                    <span className="font-mono font-bold text-slate-800 text-xs leading-none truncate block" dir="ltr">
                      {product.sku}
                    </span>
                  </div>
                </div>

                {/* Pieces per carton (Solar Layers) */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                    <SolarLayersIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">تعداد در کارتن</span>
                    <span className="font-extrabold text-slate-900 text-xs leading-none truncate block">
                      {toPersianDigits(product.piecesPerCarton)} برگ
                    </span>
                  </div>
                </div>

                {/* Brand & Factory (Solar Shop) */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                    <SolarShopIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">برند سازنده</span>
                    <span className="font-bold text-slate-900 text-xs leading-none truncate block">
                      {product.brand}
                    </span>
                  </div>
                </div>

                {/* Grade & Finish (Solar Shield Check) */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                    <SolarShieldCheckIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">درجه و لعاب</span>
                    <span className="font-bold text-slate-900 text-xs leading-none truncate block">
                      {product.grade} · {product.finish}
                    </span>
                  </div>
                </div>

                {/* Color Spectrum (Solar Palette) */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                    <SolarPaletteIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">رنگ</span>
                    <span className="font-bold text-slate-900 text-xs leading-none truncate block">
                      {product.color}
                    </span>
                  </div>
                </div>

                {/* Weight (Solar Scale) */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
                    <SolarScaleIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-medium block leading-none mb-1">وزن کارتن</span>
                    <span className="font-bold text-slate-900 text-xs leading-none truncate block">
                      {toPersianDigits(product.cartonWeightKg)} کیلوگرم
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Rich Description */}
            {(product.richDescription || product.description) && (
              <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  توضیحات
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {product.richDescription || product.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium">ویژگی‌ها:</span>
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
