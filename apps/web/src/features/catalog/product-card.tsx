import React from "react";
import type { Product } from "../../lib/mock-data/products";
import { formatToman, toPersianDigits } from "../../lib/utils/currency";
import { ZoomInIcon } from "../../components/ui/icons";
import { formatGrade } from "./catalog-store";

export interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  isInCart?: boolean;
  onToggleSelect: (product: Product) => void;
  onOpenBottomSheet?: (product: Product) => void;
}

export function ProductCard({
  product,
  isSelected,
  isInCart = false,
  onToggleSelect,
  onOpenBottomSheet,
}: ProductCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Ignore clicks on buttons or interactive thumbnail elements
    if (target.closest("button") || target.closest("[data-no-select]")) {
      return;
    }
    onToggleSelect(product);
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (!target.src.endsWith("/assets/images/placeholder.svg")) {
      target.src = "/assets/images/placeholder.svg";
    }
  };

  const imgSrc = product.images[0] || "/assets/images/placeholder.svg";

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-[12px] border transition-all duration-150 cursor-pointer overflow-hidden text-start select-none ${
        isSelected
        ? "border-emerald-600/60 scale-[0.98] shadow-[0_1px_3px_rgba(16,185,129,0.22)] bg-emerald-50/25"
          : "border-slate-200/90 hover:border-slate-300 shadow-none bg-white"
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggleSelect(product);
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
            e.stopPropagation();
            onOpenBottomSheet?.(product);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onOpenBottomSheet?.(product);
            }
          }}
          className="relative size-20 rounded-[12px] overflow-hidden shrink-0 border border-slate-200 bg-slate-100 group/img cursor-pointer transition-transform active:scale-95"
          title="مشاهده جزئیات کالا"
          aria-label={`مشاهده جزئیات ${product.name}`}
        >
          <img
            alt={product.name}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
            src={imgSrc}
            loading="lazy"
            onError={handleImgError}
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
          </div>

          <h3 className="text-sm font-bold text-slate-900 leading-2 mt-0.5">
            {product.name}
          </h3>

          {/* Dimension and Grade Badges Below Title */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className="px-2 py-0.5 rounded-[12px] text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
              {toPersianDigits(product.dimensions.width)} ×{" "}
              {toPersianDigits(product.dimensions.height)}
            </span>
            <span className="px-2 py-0.5 rounded-[12px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              {formatGrade(product.grade)}
            </span>
          </div>

          
        </div>
      </div>

      {/* Trailing Section: Price and Status Badges */}
      <div className="flex flex-col items-end shrink-0 ps-3 border-slate-100 text-end">
        {isInCart && (
          <span className="px-2 py-0.5 rounded-[12px] text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-0.5">
            در سبد خرید
          </span>
        )}

        {product.discountPercent ? (
          <>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-0.5">
              {toPersianDigits(product.discountPercent)}٪ تخفیف
            </span>
            <span className="text-[11px] text-slate-400 line-through">
              {formatToman(
                product.originalPricePerSqm || product.finalCustomerPricePerSqm,
              )}
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
        
         <span className="px-2 py-0.5 mt-1 rounded-[12px] flex text-[10px] font-semibold bg-blue-50 text-green-700 border border-blue-100">
            <span className="">
{Math.floor(Number.isFinite(Number(product.inventorySqm)) ? Number(product.inventorySqm) : 1).toLocaleString("fa-IR")} متر            </span>
            </span>
      </div>
    </div>
  );
}
