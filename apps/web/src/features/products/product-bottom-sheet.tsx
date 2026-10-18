import { useState, useMemo, useEffect } from "react";
import { Drawer, Chip } from "@heroui/react";
import type { Product } from "../../types";
import { toPersianDigits, formatToman } from "../../lib/utils/currency";
import { ImageViewerModal } from "../../components/ui/image-viewer-modal";
import { formatGrade } from "./product-store";
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
  TomanIcon,
} from "../../components/ui/icons";

export interface ProductBottomSheetProps {
  product: Product | null;
  isOpen: boolean;
  isSelected?: boolean;
  onClose: () => void;
  onToggleSelect?: () => void;
  onOrderDirect?: (product: Product) => void;
}

interface GalleryMediaItem {
  id: string;
  url: string;
  label: string;
  isSampleWork: boolean;
}

export function ProductBottomSheet({
  product,
  isOpen,
  isSelected = false,
  onClose,
  onToggleSelect,
  onOrderDirect,
}: ProductBottomSheetProps) {
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Preserve rendered product for smooth close transitions
  const [renderedProduct, setRenderedProduct] = useState<Product | null>(product);

  useEffect(() => {
    if (product) {
      setRenderedProduct(product);
    }
  }, [product]);

  const activeProduct = product || renderedProduct;

  // Consolidate tile angles and sample works into a unified gallery
  const mediaItems: GalleryMediaItem[] = useMemo(() => {
    if (!activeProduct) return [];
    const items: GalleryMediaItem[] = [];
    const seen = new Set<string>();

    const all = [
      ...(activeProduct.images || []),
      ...(activeProduct.gallery || []),
    ].filter(Boolean);

    all.forEach((url, idx) => {
      if (!seen.has(url)) {
        seen.add(url);
        items.push({
          id: `media-${idx}`,
          url,
          label: idx === 0 ? "تصویر اصلی" : `نمونه‌کار ${toPersianDigits(idx)}`,
          isSampleWork: idx > 0,
        });
      }
    });

    if (items.length === 0) {
      items.push({
        id: "placeholder",
        url: "/assets/images/placeholder.svg",
        label: "تصویر شاخص",
        isSampleWork: false,
      });
    }

    return items;
  }, [activeProduct]);

  // Sync active image when product changes
  useEffect(() => {
    if (activeProduct && activeProduct.images && activeProduct.images.length > 0) {
      setActiveImageUrl(activeProduct.images[0] ?? null);
    }
  }, [activeProduct]);

  if (!activeProduct) return null;

  const isOutOfStock = activeProduct.stockStatus === "out_of_stock";
  const isLowStock = activeProduct.stockStatus === "low_stock";
  const currentHeroUrl = activeImageUrl || activeProduct.images[0] || "";
  const currentMediaItem = mediaItems.find((m) => m.url === currentHeroUrl);

  return (
    <>
      <Drawer>
        <Drawer.Backdrop
          isOpen={isOpen}
          onOpenChange={(open) => !open && onClose()}
          className="fixed z-50 backdrop-blur-xs min-h-60 flex items-end justify-center fade-up transition-all duration-300"
        >
          <Drawer.Content
            placement="bottom"
            className="w-full max-w-lg mx-auto fixed z-50 bottom-0 top-[22%] h-auto! rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <Drawer.Dialog className="flex flex-col h-full min-h-0 outline-none text-start overscroll-contain">
              {/* Drag Handle UI */}
              <div className="flex justify-center w-full shrink-0">
                <Drawer.Handle className="w-16 h-1.5 rounded-full" />
              </div>

              {/* Header */}
              <Drawer.Header className="w-full flex flex-row! items-center justify-between px-5 pt-1 pb-3 border-b border-separator shrink-0">
                <div className="min-w-0 flex-1 flex flex-col items-start text-start">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/25 self-start">
                    {activeProduct.category}
                  </span>
                  <Drawer.Heading className="text-sm font-extrabold text-foreground mt-1 line-clamp-2 text-start leading-snug">
                    {activeProduct.name}
                  </Drawer.Heading>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="بستن"
                  className="size-10 rounded-xl bg-default/50 hover:bg-default/35 text-muted hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  <XIcon />
                </button>
              </Drawer.Header>

              {/* Body */}
              <Drawer.Body className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-3 space-y-3 scrollbar-thin">
                {/* 1. Main Hero Preview */}
                <div className="space-y-2">
                  <div
                    className="relative aspect-16/10 shrink-0 overflow-hidden bg-default/15 rounded-[20px] border border-border group"
                    style={
                      {
                        cornerShape: "squircle",
                        WebkitCornerShape: "squircle",
                      } as React.CSSProperties
                    }
                  >
                    <img
                      src={currentHeroUrl || "/assets/images/placeholder.svg"}
                      alt={activeProduct.name}
                      className="w-full h-full object-cover rounded-[20px]"
                      style={
                        {
                          cornerShape: "squircle",
                          WebkitCornerShape: "squircle",
                        } as React.CSSProperties
                      }
                    />

                    {/* Lightbox Trigger on Hero Preview */}
                    <button
                      type="button"
                      onClick={() => setZoomImageUrl(currentHeroUrl)}
                      className="absolute bottom-2 end-2 px-2.5 py-1 rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-xs text-primary-foreground text-[10px] font-semibold flex items-center gap-1 shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      <ZoomInIcon size={12} />
                      <span>بزرگ‌نمایی</span>
                    </button>

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 start-2 flex items-center gap-1">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-lg bg-danger text-danger-foreground text-[10px] font-semibold shadow-xs">
                          ناموجود در انبار
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-lg bg-warning text-warning-foreground text-[10px] font-semibold shadow-xs">
                          موجودی محدود ({toPersianDigits(activeProduct.inventorySqm)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-success text-success-foreground text-[10px] font-semibold shadow-xs">
                          موجود در انبار
                        </span>
                      )}

                      {currentMediaItem?.isSampleWork && (
                        <span className="px-2 py-0.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold shadow-xs">
                          نمونه‌کار اجرایی
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Interactive Thumbnail Cards */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[11px] text-foreground font-bold">
                        تصاویر کالا
                      </span>

                      <Chip
                        size="sm"
                        variant="soft"
                        color={
                          isOutOfStock
                            ? "danger"
                            : isLowStock
                              ? "warning"
                              : "success"
                        }
                        className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          isOutOfStock
                            ? "bg-danger/10 text-danger border-danger/30"
                            : isLowStock
                              ? "bg-warning/10 text-warning border-warning/30"
                              : "bg-success/15 text-success border-success/30"
                        }`}
                      >
                        {isOutOfStock ? (
                          "ناموجود در انبار"
                        ) : (
                          <>
                            موجودی انبار:{" "}
                            {toPersianDigits(activeProduct.inventorySqm)} متر (
                            {toPersianDigits(activeProduct.stockCartons)} کارتن)
                          </>
                        )}
                      </Chip>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                      {mediaItems.map((item) => {
                        const isActive = item.url === currentHeroUrl;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveImageUrl(item.url)}
                            aria-label={item.label}
                            title={item.label}
                            className={`group relative w-13 h-13 sm:w-14 sm:h-14 shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
                              isActive
                                ? "scale-[1.03] opacity-100"
                                : "opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={item.url || "/assets/images/placeholder.svg"}
                              alt=""
                              className={`w-full h-full object-cover rounded-[14px] border ${
                                isActive
                                  ? "border-primary border-2"
                                  : "border-border"
                              } group-hover:scale-105 transition-transform`}
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (
                                  !target.src.endsWith(
                                    "/assets/images/placeholder.svg",
                                  )
                                ) {
                                  target.src = "/assets/images/placeholder.svg";
                                }
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Price & Selection Action Strip */}
                <div className="p-2.5 bg-default/10 rounded-2xl border border-border flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-baseline gap-1.5 whitespace-nowrap">
                    {activeProduct.discountPercent ? (
                      <>
                        <span className="text-sm font-extrabold text-danger inline-flex items-center gap-1">
                          <span>
                            {formatToman(activeProduct.finalCustomerPricePerSqm)}
                          </span>
                          <TomanIcon className="size-4" />
                        </span>
                        <span className="text-[10px] text-muted line-through inline-flex items-center gap-0.5">
                          <span>
                            {formatToman(
                              activeProduct.originalPricePerSqm ||
                                activeProduct.finalCustomerPricePerSqm,
                            )}
                          </span>
                          <TomanIcon className="size-3" />
                        </span>
                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-danger/15 text-danger">
                          {toPersianDigits(activeProduct.discountPercent)}٪
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-extrabold text-foreground inline-flex items-center gap-1">
                        <span>
                          {formatToman(activeProduct.finalCustomerPricePerSqm)}
                        </span>
                        <TomanIcon className="size-4" />
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
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-surface hover:bg-default/15 text-foreground border border-border"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckIcon
                              size={13}
                              className="stroke-[3] text-success"
                            />
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
                        onClick={() => onOrderDirect(activeProduct)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-primary/20 active:scale-95 whitespace-nowrap shrink-0"
                      >
                        <span>ثبت سفارش</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Structured Specifications with Solar Icons */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <SolarLayersIcon size={13} />
                    </span>
                    <span>مشخصات فنی</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {/* Dimensions (Solar Ruler) */}
                    <div className="p-2 bg-default/10 rounded-xl border border-border flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                        <SolarRulerIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-muted font-medium block leading-tight mb-0.5">
                          ابعاد
                        </span>
                        <span className="font-bold text-foreground text-xs leading-normal truncate block">
                          {toPersianDigits(activeProduct.dimensions.width)} ×{" "}
                          {toPersianDigits(activeProduct.dimensions.height)}
                        </span>
                      </div>
                    </div>

                    {/* Authoritative sqmPerCarton (Solar Box) */}
                    <div className="p-2 bg-default/10 rounded-xl border border-border flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                        <SolarBoxIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-muted font-medium block leading-tight mb-0.5">
                          متراژ در کارتن
                        </span>
                        <span className="font-bold text-primary text-xs leading-normal truncate block">
                          {toPersianDigits(activeProduct.sqmPerCarton)}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-default/10 rounded-xl border border-border flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                        <SolarTagIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-muted font-medium block leading-tight mb-0.5">
                          شناسه کالا
                        </span>
                        <span
                          className="font-mono font-bold text-foreground text-xs leading-normal truncate block"
                          dir="ltr"
                        >
                          {activeProduct.sku}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-default/10 rounded-xl border border-border flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                        <SolarLayersIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-muted font-medium block leading-tight mb-0.5">
                          تعداد در کارتن
                        </span>
                        <span className="font-bold text-foreground text-xs leading-normal truncate block">
                          {toPersianDigits(activeProduct.piecesPerCarton)} برگ
                        </span>
                      </div>
                    </div>

                    {/* Brand & Factory (Solar Shop) */}
                    <div className="p-2 bg-default/10 rounded-xl border border-border flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                        <SolarShopIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-muted font-medium block leading-tight mb-0.5">
                          برند
                        </span>
                        <span className="font-bold text-foreground text-xs leading-normal truncate block">
                          {activeProduct.brand}
                        </span>
                      </div>
                    </div>

                    {/* Grade (Solar Shield Check) */}
                    <div className="p-2 bg-default/10 rounded-xl border border-border flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                        <SolarShieldCheckIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-muted font-medium block leading-tight mb-0.5">
                          درجه کیفی
                        </span>
                        <span className="font-bold text-foreground text-xs leading-normal truncate block">
                          {formatGrade(activeProduct.grade)}
                        </span>
                      </div>
                    </div>

                    {/* Color Spectrum (Solar Palette) */}
                    <div className="p-2 bg-default/10 rounded-xl border border-border flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                        <SolarPaletteIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-muted font-medium block leading-tight mb-0.5">
                          رنگ
                        </span>
                        <span className="font-bold text-foreground text-xs leading-normal truncate block">
                          {activeProduct.color}
                        </span>
                      </div>
                    </div>

                    {/* Weight (Solar Scale) */}
                    <div className="p-2 bg-default/10 rounded-xl border border-border flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                        <SolarScaleIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-muted font-medium block leading-tight mb-0.5">
                          وزن هر کارتن
                        </span>
                        <span className="font-bold text-foreground text-xs leading-normal truncate block">
                          {toPersianDigits(activeProduct.cartonWeightKg)} کیلوگرم
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Rich Description */}
                {(activeProduct.richDescription || activeProduct.description) && (
                  <div className="p-2.5 bg-default/10 rounded-xl border border-border space-y-0.5">
                    <span className="text-[10px] font-bold text-muted block mb-0.5">
                      توضیحات
                    </span>
                    <p className="text-[11px] text-foreground leading-relaxed">
                      {activeProduct.richDescription || activeProduct.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {activeProduct.tags.length > 0 && (
                  <div className="pt-2 border-t border-separator flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-muted font-medium">
                      ویژگی‌ها:
                    </span>
                    {activeProduct.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-default/15 text-muted text-[10px] font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>

      {/* Standalone Image Viewer Lightbox */}
      {zoomImageUrl && (
        <ImageViewerModal
          isOpen={Boolean(zoomImageUrl)}
          onClose={() => setZoomImageUrl(null)}
          imageUrl={zoomImageUrl}
          title={activeProduct.name}
        />
      )}
    </>
  );
}
