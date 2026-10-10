import React from 'react'
import type { Product } from '../../lib/mock-data/products'
import type { ViewMode } from './catalog-store'
import { formatToman, toPersianDigits } from '../../lib/utils/currency'
import { ZoomInIcon, CheckIcon } from '../../components/ui/icons'

export interface ProductCardProps {
  product: Product
  isSelected: boolean
  isInCart?: boolean
  viewMode?: ViewMode
  onToggleSelect: (product: Product) => void
  onOpenBottomSheet: (product: Product) => void
}

export function ProductCard({
  product,
  isSelected,
  isInCart = false,
  viewMode = 'list',
  onToggleSelect,
  onOpenBottomSheet,
}: ProductCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    // Ignore clicks on buttons or interactive thumbnail elements
    if (target.closest('button') || target.closest('[data-no-select]')) {
      return
    }
    onToggleSelect(product)
  }

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget
    if (!target.src.includes('tile-sample-1.jpg') && !target.src.includes('placeholder.svg')) {
      target.src = '/assets/images/tile-sample-1.jpg'
    } else if (!target.src.includes('placeholder.svg')) {
      target.src = '/assets/images/placeholder.svg'
    }
  }

  // 1. Grid 2-Column Mode (grid-2)
  if (viewMode === 'grid-2') {
    return (
      <div
        onClick={handleCardClick}
        className={`group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 cursor-pointer overflow-hidden text-start select-none ${
          isSelected
            ? 'border-emerald-600/70 shadow-[0_2px_8px_rgba(16,185,129,0.22)] bg-emerald-50/25 ring-1 ring-emerald-500/30'
            : 'border-slate-200/90 hover:border-slate-300 shadow-none bg-white hover:shadow-xs'
        }`}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onToggleSelect(product)
          }
        }}
      >
        {/* Selected badge overlay */}
        {isSelected && (
          <div className="absolute top-2.5 end-2.5 z-10 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <CheckIcon size={12} strokeWidth={3} />
          </div>
        )}

        {/* Thumbnail with overlay badges */}
        <div
          data-no-select
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            onOpenBottomSheet(product)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              onOpenBottomSheet(product)
            }
          }}
          className="relative w-full aspect-square rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 group/img cursor-pointer transition-transform active:scale-98"
          title="مشاهده مشخصات و گالری نمونه‌کارها"
          aria-label={`مشاهده مشخصات و نمونه کارهای ${product.name}`}
        >
          <img
            alt={product.name}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
            src={product.images[0] || '/assets/images/tile-sample-1.jpg'}
            loading="lazy"
            onError={handleImgError}
          />

          {/* Floating dimension badge on image */}
          <div className="absolute bottom-1.5 start-1.5 flex items-center gap-1 pointer-events-none">
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white shadow-xs">
              {toPersianDigits(product.dimensions.width)} × {toPersianDigits(product.dimensions.height)}
            </span>
          </div>

          {/* Floating discount badge */}
          {product.discountPercent && (
            <div className="absolute top-1.5 start-1.5 pointer-events-none">
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-xs animate-pulse">
                {toPersianDigits(product.discountPercent)}٪ تخفیف
              </span>
            </div>
          )}

          {/* Hover hint icon */}
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <span className="p-1 rounded-md bg-slate-900/80 text-white shadow-xs">
              <ZoomInIcon size={13} />
            </span>
          </div>
        </div>

        {/* Info & Metadata */}
        <div className="flex flex-col pt-2 min-w-0 flex-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold gap-1">
            <span className="truncate">{product.brand}</span>
            <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 shrink-0">
              {product.grade}
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-1 min-h-[2.2rem]">
            {product.name}
          </h3>
        </div>

        {/* Price & Cart status */}
        <div className="pt-2 mt-auto border-t border-slate-100 flex items-end justify-between">
          <div className="flex flex-col text-start">
            {product.discountPercent ? (
              <>
                <span className="text-[10px] text-slate-400 line-through">
                  {formatToman(product.originalPricePerSqm || product.finalCustomerPricePerSqm)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-rose-600">
                  {formatToman(product.finalCustomerPricePerSqm)}
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {formatToman(product.finalCustomerPricePerSqm)}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-normal">هر متر مربع</span>
          </div>
          {isInCart && (
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              در سبد
            </span>
          )}
        </div>
      </div>
    )
  }

  // 2. Compact High-Density Mode (compact)
  if (viewMode === 'compact') {
    return (
      <div
        onClick={handleCardClick}
        className={`group relative flex items-center justify-between p-2 sm:px-3 rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden text-start select-none ${
          isSelected
            ? 'border-emerald-600/70 shadow-xs bg-emerald-50/25 ring-1 ring-emerald-500/20'
            : 'border-slate-200/90 hover:border-slate-300 shadow-none bg-white'
        }`}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onToggleSelect(product)
          }
        }}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {/* Checkbox indicator */}
          <div
            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
              isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-slate-50'
            }`}
          >
            {isSelected && <CheckIcon size={11} strokeWidth={3} />}
          </div>

          {/* Micro thumbnail */}
          <div
            data-no-select
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onOpenBottomSheet(product)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                onOpenBottomSheet(product)
              }
            }}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 cursor-pointer active:scale-95"
            title="مشاهده مشخصات"
          >
            <img
              alt={product.name}
              className="w-full h-full object-cover"
              src={product.images[0] || '/assets/images/tile-sample-1.jpg'}
              loading="lazy"
              onError={handleImgError}
            />
          </div>

          {/* Title & Brand */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3 className="text-xs font-bold text-slate-900 truncate">
              {product.name}
            </h3>
            <span className="text-[11px] text-slate-400 truncate hidden xs:inline">
              {product.brand}
            </span>
          </div>

          {/* Dimension pill */}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 shrink-0">
            {toPersianDigits(product.dimensions.width)}×{toPersianDigits(product.dimensions.height)}
          </span>
        </div>

        {/* Price & status */}
        <div className="flex items-center gap-2.5 shrink-0 ps-2.5">
          {isInCart && (
            <span className="hidden sm:inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              سبد
            </span>
          )}
          <div className="text-end">
            {product.discountPercent ? (
              <span className="text-xs sm:text-sm font-bold text-rose-600">
                {formatToman(product.finalCustomerPricePerSqm)}
              </span>
            ) : (
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {formatToman(product.finalCustomerPricePerSqm)}
              </span>
            )}
            <span className="text-[10px] text-slate-400 block -mt-0.5">تومان/م²</span>
          </div>
        </div>
      </div>
    )
  }

  // 3. Showcase / Visual Luxury Mode (showcase)
  if (viewMode === 'showcase') {
    return (
      <div
        onClick={handleCardClick}
        className={`group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-3xl border transition-all duration-150 cursor-pointer overflow-hidden text-start select-none ${
          isSelected
            ? 'border-emerald-600/70 shadow-[0_4px_16px_rgba(16,185,129,0.2)] bg-emerald-50/20 ring-1 ring-emerald-500/30'
            : 'border-slate-200/90 hover:border-slate-300 bg-white hover:shadow-xs'
        }`}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onToggleSelect(product)
          }
        }}
      >
        {/* Large visual cover */}
        <div
          data-no-select
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            onOpenBottomSheet(product)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              onOpenBottomSheet(product)
            }
          }}
          className="relative w-full aspect-16/10 rounded-2xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 group/img cursor-pointer transition-transform active:scale-98"
          title="مشاهده آلبوم و مشخصات فنی"
        >
          <img
            alt={product.name}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
            src={product.images[0] || '/assets/images/tile-sample-1.jpg'}
            loading="lazy"
            onError={handleImgError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20 pointer-events-none" />

          {/* Top floating badges */}
          <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5 pointer-events-none">
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-900/80 backdrop-blur-md text-white shadow-xs">
              {product.brand}
            </span>
            {product.finish && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
                {product.finish}
              </span>
            )}
          </div>

          {isSelected && (
            <div className="absolute top-2.5 end-2.5 z-10 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-md pointer-events-none">
              <CheckIcon size={13} strokeWidth={3} />
              <span>انتخاب شد</span>
            </div>
          )}

          {/* Bottom floating specs */}
          <div className="absolute bottom-2.5 start-2.5 end-2.5 flex items-center justify-between text-white pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-950/70 backdrop-blur-md">
                {toPersianDigits(product.dimensions.width)} × {toPersianDigits(product.dimensions.height)}
              </span>
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-600/80 backdrop-blur-md">
                {product.grade}
              </span>
            </div>
            {product.discountPercent && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-600 backdrop-blur-md animate-pulse">
                {toPersianDigits(product.discountPercent)}٪ تخفیف طرح
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pt-3 pb-2 space-y-1">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1">
            {product.description || `کاشی پرسلان کیفیت عالی برند ${product.brand} مناسب دکوراسیون و نما`}
          </p>
        </div>

        {/* Price & action footer */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            {product.discountPercent ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 line-through">
                  {formatToman(product.originalPricePerSqm || product.finalCustomerPricePerSqm)}
                </span>
                <span className="text-sm sm:text-base font-bold text-rose-600">
                  {formatToman(product.finalCustomerPricePerSqm)}
                </span>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-bold text-slate-900">
                {formatToman(product.finalCustomerPricePerSqm)}
              </span>
            )}
            <span className="text-[11px] text-slate-400">قیمت هر متر مربع</span>
          </div>

          <div className="flex items-center gap-1.5" data-no-select>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenBottomSheet(product)
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              مشاهده جزئیات
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 4. Default Standard List Mode (list)
  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 cursor-pointer overflow-hidden text-start select-none ${
        isSelected
          ? 'border-emerald-600/60 shadow-[0_1px_3px_rgba(16,185,129,0.22)] bg-emerald-50/25'
          : 'border-slate-200/90 hover:border-slate-300 shadow-none bg-white'
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onToggleSelect(product)
        }
      }}
    >
      {/* Leading Thumbnail (Image Click ONLY opens Bottom Sheet) */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div
          data-no-select
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            onOpenBottomSheet(product)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              onOpenBottomSheet(product)
            }
          }}
          className="relative w-15 h-15 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 group/img cursor-pointer transition-transform active:scale-95"
          title="مشاهده مشخصات و گالری نمونه‌کارها"
          aria-label={`مشاهده مشخصات و نمونه کارهای ${product.name}`}
        >
          <img
            alt={product.name}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
            src={product.images[0] || '/assets/images/tile-sample-1.jpg'}
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget
              if (!target.src.includes('tile-sample-1.jpg') && !target.src.includes('placeholder.svg')) {
                target.src = '/assets/images/tile-sample-1.jpg'
              } else if (!target.src.includes('placeholder.svg')) {
                target.src = '/assets/images/placeholder.svg'
              }
            }}
          />

          {/* Hover hint icon */}
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <span className="p-1 rounded-md bg-slate-900/80 text-white shadow-xs">
              <ZoomInIcon size={12} />
            </span>
          </div>
        </div>

        {/* Center Content: Dimensions & Metadata */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 truncate max-w-[120px]">
              {product.brand}
            </span>
            {product.finish && (
              <>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs text-slate-400 font-normal">{product.finish}</span>
              </>
            )}
          </div>

          <h3 className="text-sm font-bold text-slate-900 leading-snug truncate mt-0.5">
            {product.name}
          </h3>

          {/* Dimension and Grade Badges Below Title */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              {toPersianDigits(product.dimensions.width)} × {toPersianDigits(product.dimensions.height)}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              {product.grade}
            </span>
          </div>
        </div>
      </div>

      {/* Trailing Section: Price and Status Badges */}
      <div className="flex flex-col items-end shrink-0 ps-3 border-s border-slate-100 text-end">
        {isInCart && (
          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-0.5">
            در سبد خرید
          </span>
        )}
        {product.discountPercent ? (
          <>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-0.5 animate-pulse">
              {toPersianDigits(product.discountPercent)}٪ تخفیف طرح
            </span>
            <span className="text-[11px] text-slate-400 line-through">
              {formatToman(product.originalPricePerSqm || product.finalCustomerPricePerSqm)}
            </span>
            <span className="text-sm font-bold text-rose-600">
              {formatToman(product.finalCustomerPricePerSqm)}
            </span>
          </>
        ) : (
          <span className="text-sm font-bold text-slate-900">
            {formatToman(product.finalCustomerPricePerSqm)}
          </span>
        )}
        <span className="text-xs font-normal text-slate-400">
          هر متر مربع
        </span>
      </div>
    </div>
  )
}
