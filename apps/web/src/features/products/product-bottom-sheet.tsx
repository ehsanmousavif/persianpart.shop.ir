import { useState, useMemo, useEffect } from "react";
import { Drawer, Button } from "@heroui/react";
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
  onOrderDirect: _onOrderDirect,
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
            className="w-full max-w-lg mx-auto fixed z-50 bottom-0 top-[22%] h-auto! rounded-t-2xl flex flex-col overflow-hidden"
          >
            <Drawer.Dialog className="flex flex-col h-full min-h-0 outline-none text-start overscroll-contain">
              {/* Drag Handle UI */}
              <div className="flex justify-center w-full shrink-0">
                <Drawer.Handle className="w-16 h-1.5 rounded-full" />
              </div>

              {/* Header */}
              <Drawer.Header className="w-full flex flex-row! items-center justify-between px-5 pt-2 pb-2 shrink-0">
                <div className="min-w-0 flex-1 flex flex-col items-start text-start">
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-muted/10 text-foreground self-start">
                    {activeProduct.category}
                  </span>
                  <Drawer.Heading className="text-sm font-extrabold text-foreground mt-1 text-start leading-snug">
                    {activeProduct.name}
                  </Drawer.Heading>
                </div>

                <Button
                  type="button"
                  onClick={onClose}
                  aria-label="بستن"
                  className="size-10 rounded-2xl bg-muted/10 hover:bg-muted/20 text-muted hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  <XIcon />
                </Button>
              </Drawer.Header>

              {/* Body */}
              <Drawer.Body className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-3 space-y-3 scrollbar-thin">
                {/* 1. Main Hero Preview */}
                <div className="space-y-2">
                  <div className="relative aspect-16/10 shrink-0 overflow-hidden bg-muted/10 rounded-2xl group">
                    <img
                      src={currentHeroUrl || "/assets/images/placeholder.svg"}
                      alt={activeProduct.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />

                    <Button
                      type="button"
                      onClick={() => setZoomImageUrl(currentHeroUrl)}
                      className="absolute bottom-2 inset-e-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                    >
                      <ZoomInIcon size={14} />
                      <span>بزرگ‌نمایی</span>
                    </Button>

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 inset-s-2 flex items-center gap-1">
                      {isOutOfStock ? (
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-danger/15 text-danger backdrop-blur-xs">
                          ناموجود در انبار
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-warning/15 text-warning backdrop-blur-xs">
                          موجودی محدود ({toPersianDigits(activeProduct.inventorySqm)})
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-success/15 text-success backdrop-blur-xs">
                          موجود در انبار
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Interactive Thumbnail Cards */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-xs text-foreground font-bold">
                        تصاویر کالا
                      </span>

                      <span
                        className={`px-2 py-2 rounded-lg text-xs font-semibold ${
                          isOutOfStock
                            ? "bg-danger/15 text-danger"
                            : isLowStock
                              ? "bg-warning/15 text-warning"
                              : "bg-muted/10 text-foreground"
                        }`}
                      >
                        {isOutOfStock ? (
                          "ناموجود در انبار"
                        ) : (
                          <>
                            موجودی انبار:
                            {toPersianDigits(activeProduct.inventorySqm)} متر (
                            {toPersianDigits(activeProduct.stockCartons)} کارتن)
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                      {mediaItems.map((item) => {
                        const isActive = item.url === currentHeroUrl;
                        return (
                          <Button
                            key={item.id}
                            type="button"
                            onPress={() => setActiveImageUrl(item.url)}
                            aria-label={item.label}
                            className={`group relative size-14 shrink-0 rounded-2xl p-0.5 transition-all cursor-pointer select-none active:scale-95 ${
                              isActive
                                ? "bg-primary scale-[1.03]"
                                : "bg-muted/10 hover:bg-muted/20 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={item.url || "/assets/images/placeholder.svg"}
                              alt=""
                              className="w-full h-full object-cover rounded-2xl transition-transform group-hover:scale-105"
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
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Price & Selection Action Strip */}
                <div className="p-3 bg-muted/5 rounded-2xl flex items-center justify-between gap-2">
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
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-danger/15 text-danger">
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
                      <Button
                        type="button"
                        onClick={onToggleSelect}
                        className={`h-9 px-3.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0 ${
                          isSelected
                            ? "bg-success/15 text-success"
                            : "bg-muted/10 hover:bg-muted/20 text-foreground"
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
                      </Button>
                    )}

                  </div>
                </div>

                {/* Structured Specifications with Solar Icons */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <SolarLayersIcon size={14} />
                    </span>
                    <span>مشخصات فنی</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Dimensions (Solar Ruler) */}
                    <div className="p-2.5 bg-muted/5 rounded-2xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <SolarRulerIcon size={15} />
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
                    <div className="p-2.5 bg-muted/5 rounded-2xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <SolarBoxIcon size={15} />
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

                    <div className="p-2.5 bg-muted/5 rounded-2xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <SolarTagIcon size={15} />
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

                    <div className="p-2.5 bg-muted/5 rounded-2xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <SolarLayersIcon size={15} />
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
                    <div className="p-2.5 bg-muted/5 rounded-2xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <SolarShopIcon size={15} />
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
                    <div className="p-2.5 bg-muted/5 rounded-2xl flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <SolarShieldCheckIcon size={15} />
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
                  </div>
                </div>

                {/* Optional Rich Description */}
                {(activeProduct.richDescription || activeProduct.description) && (
                  <div className="p-3 bg-muted/5 rounded-2xl space-y-1">
                    <span className="text-xs font-bold text-muted block">
                      توضیحات
                    </span>
                    <p className="text-xs text-foreground leading-relaxed">
                      {activeProduct.richDescription || activeProduct.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {activeProduct.tags.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted font-medium">
                      ویژگی‌ها:
                    </span>
                    {activeProduct.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-muted/10 text-foreground"
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
