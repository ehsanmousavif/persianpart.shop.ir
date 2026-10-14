import React from "react";
import type { Product } from "../../types";
import { formatToman, toPersianDigits } from "../../lib/utils/currency";
import TomanIcon, { ZoomInIcon } from "../../components/ui/icons";
import { formatGrade } from "./product-store";

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
          ? "border-success/60 scale-[0.985] shadow-sm shadow-success/20 bg-success/10"
          : "border-border hover:border-border shadow-none bg-surface"
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
          className="relative size-20 rounded-[12px] overflow-hidden shrink-0 border border-border bg-default/15 group/img cursor-pointer transition-transform active:scale-95"
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
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <span className="p-1 rounded-md bg-primary text-primary-foreground shadow-xs">
              <ZoomInIcon size={12} />
            </span>
          </div>
        </div>

        {/* Center Content: Dimensions & Metadata */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted truncate max-w-[120px]">
              {product.brand}
            </span>
          </div>

          <h3 className="text-sm font-bold text-foreground leading-2 mt-0.5">
            {product.name}
          </h3>

          {/* Dimension and Grade Badges Below Title */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className="px-2 py-0.5 rounded-[12px] text-xs font-semibold bg-default/15 text-foreground border border-border">
              {toPersianDigits(product.dimensions.width)} ×{" "}
              {toPersianDigits(product.dimensions.height)}
            </span>
            <span className="px-2 py-0.5 rounded-[12px] text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
              {formatGrade(product.grade)}
            </span>
          </div>
        </div>
      </div>

      {/* Trailing Section: Price and Status Badges */}
      <div className="flex flex-col items-end shrink-0 ps-3 border-separator text-end">
        {isInCart && (
          <span className="px-2 py-0.5 rounded-[12px] text-xs font-semibold bg-primary/10 text-primary border border-primary/25 mb-0.5">
            در سبد خرید
          </span>
        )}

        {product.discountPercent ? (
          <>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger border border-danger/30 mb-0.5">
              {toPersianDigits(product.discountPercent)}٪ تخفیف
            </span>
            <span className="text-[11px] text-muted line-through inline-flex items-center gap-0.5">
              <span>
                {formatToman(
                  product.originalPricePerSqm || product.finalCustomerPricePerSqm,
                )}
              </span>
              <TomanIcon className="size-2.5" />
            </span>
            <span className="text-sm font-bold text-danger inline-flex items-center gap-1">
              <span>{formatToman(product.finalCustomerPricePerSqm)}</span>
              <TomanIcon className="size-3" />
            </span>
          </>
        ) : (
          <span className="text-sm font-bold text-foreground inline-flex items-center gap-1">
            <span>{formatToman(product.finalCustomerPricePerSqm)}</span>
            <TomanIcon className="size-3.5" />
          </span>
        )}

        <span className="px-2 py-0.5 mt-1 rounded-[12px] flex text-[10px] font-semibold bg-success/10 text-success border border-success/30">
          <span className="">
            {Math.floor(
              Number.isFinite(Number(product.inventorySqm))
                ? Number(product.inventorySqm)
                : 1,
            ).toLocaleString("fa-IR")}{" "}
            متر{" "}
          </span>
        </span>
      </div>
    </div>
  );
}
